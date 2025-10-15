import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { getTwilioClient, getTwilioFromPhoneNumber } from "./twilio-client";
import { OpenAIRealtimeClient } from "./openai-realtime";
import { insertCallSchema, insertBookingSchema, insertClubSettingsSchema } from "@shared/schema";
import voiceRouter from "./voice";

const router = express.Router();
router.use("/api/twilio/incoming", voiceRouter);


// Store active call sessions
const activeSessions = new Map<string, { twilioWs: WebSocket; openaiClient: OpenAIRealtimeClient; callId: string; streamSid: string }>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
// WebSocket endpoint for Twilio Media Stream
const mediaWss = new WebSocketServer({ server: httpServer, path: "/media-stream" });

mediaWss.on("connection", (ws) => {
  console.log("✅ Twilio Media Stream connected!");

  ws.on("message", (msg) => {
    console.log("📡 Incoming audio frame from Twilio:", msg.toString().slice(0, 60));
    // TODO: Later — forward this audio to OpenAI Realtime API
  });

  ws.on("close", () => console.log("❌ Media stream closed"));
});

  // WebSocket server for real-time updates and call handling
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'end_call') {
          const session = activeSessions.get(data.callSid);
          if (session) {
            try {
              const twilioClient = await getTwilioClient();
              await twilioClient.calls(data.callSid).update({ status: 'completed' });
              session.openaiClient.close();
              if (session.twilioWs.readyState === WebSocket.OPEN) {
                session.twilioWs.close();
              }
              activeSessions.delete(data.callSid);
            } catch (error) {
              console.error('Error ending call:', error);
            }
          }
        } else if (data.type === 'forward_call') {
          const settings = await storage.getSettings();
          if (settings.forwardingEnabled && settings.forwardingNumber) {
            const session = activeSessions.get(data.callSid);
            if (session) {
              try {
                const twilioClient = await getTwilioClient();
                // Close OpenAI connection and forward the call
                session.openaiClient.close();
                await twilioClient.calls(data.callSid).update({
                  twiml: `<Response><Dial>${settings.forwardingNumber}</Dial></Response>`
                });
                activeSessions.delete(data.callSid);
              } catch (error) {
                console.error('Error forwarding call:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Twilio webhook for incoming calls
  app.post('/api/twilio/incoming', async (req, res) => {
    try {
      const { CallSid, From, To } = req.body;

      // Create call record
      const call = await storage.createCall({
        callSid: CallSid,
        fromNumber: From,
        toNumber: To,
        status: 'ringing',
      });

      // Get settings for AI instructions
      const settings = await storage.getSettings();
      const aiInstructions = settings.aiInstructions || `You are a helpful AI receptionist for ${settings.name}. 
        The club is open from ${settings.openTime} to ${settings.closeTime}. 
        We have ${settings.totalCourts} tennis courts available for booking.
        Be professional, friendly, and assist callers with court bookings, club information, and general inquiries.
        If someone wants to book a court, collect their name, phone number, preferred date, time, and court number.`;

  const streamUrl = `wss://${process.env.RENDER_EXTERNAL_HOSTNAME || req.headers.host}/api/twilio/media-stream`;

const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hi there! Connecting you to the AI receptionist now.</Say>
  <Connect>
    <Stream url="${streamUrl}" />
  </Connect>
</Response>`;

console.log("✅ Sending TwiML to Twilio:", twiml);
      res.type('text/xml');
      res.send(twiml);
      

      // Update call status
      await storage.updateCall(call.id, { status: 'in-progress' });

      // Broadcast to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'call_update',
            call: {
              callSid: CallSid,
              fromNumber: From,
              status: 'in-progress',
              duration: 0,
              startTime: new Date().toISOString(),
            },
          }));
        }
      });

    } catch (error) {
      console.error('Incoming call error:', error);
      res.status(500).send('Error processing call');
    }
  });

  // Twilio Media Stream WebSocket endpoint (using separate WebSocket server)
  const mediaWss = new WebSocketServer({ server: httpServer, path: '/api/twilio/media-stream' });
  
  mediaWss.on('connection', async (ws) => {
    console.log('Twilio Media stream connected');
    let callSid: string;
    let streamSid: string;
    let openaiClient: OpenAIRealtimeClient | null = null;
    let callStartTime = Date.now();

    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.event === 'start') {
          callSid = data.start.callSid;
          streamSid = data.start.streamSid;
          callStartTime = Date.now();
          
          console.log(`Media stream started for call ${callSid}`);
          
          // Initialize OpenAI Realtime
          openaiClient = new OpenAIRealtimeClient(process.env.OPENAI_API_KEY!);
          await openaiClient.connect();

          const settings = await storage.getSettings();
          const aiInstructions = settings.aiInstructions || `You are a helpful AI receptionist for ${settings.name}. 
            The club is open from ${settings.openTime} to ${settings.closeTime}. 
            We have ${settings.totalCourts} tennis courts available.
            Be professional, friendly, and assist with bookings and inquiries.`;
          
          openaiClient.configureSession(aiInstructions);

          // Store session with streamSid
          const calls = await storage.getAllCalls();
          const call = calls.find(c => c.callSid === callSid);
          if (call) {
            activeSessions.set(callSid, { twilioWs: ws, openaiClient, callId: call.id, streamSid });
            
            // Broadcast call update to UI
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'call_update',
                  call: {
                    callSid,
                    fromNumber: call.fromNumber,
                    status: 'in-progress',
                    duration: 0,
                    startTime: call.startTime.toISOString(),
                  },
                }));
              }
            });
          }

          // Handle OpenAI responses - send audio back to Twilio
          openaiClient.onMessage((message) => {
            if (message.type === 'response.audio.delta' && message.delta) {
              // Send audio from OpenAI back to Twilio with track at top level
              ws.send(JSON.stringify({
                event: 'media',
                streamSid: streamSid,
                track: 'outbound',
                media: {
                  payload: message.delta,
                },
              }));
            } else if (message.type === 'input_audio_buffer.speech_started') {
              console.log('User started speaking');
            } else if (message.type === 'input_audio_buffer.speech_stopped') {
              console.log('User stopped speaking - committing buffer');
              // When user stops speaking, commit the buffer and create response
              openaiClient.commitAudioBuffer();
            } else if (message.type === 'input_audio_buffer.committed') {
              console.log('Audio buffer committed - creating response');
              openaiClient.createResponse();
            } else if (message.type === 'response.done') {
              console.log('Response completed');
            } else if (message.type === 'conversation.item.created') {
              console.log('OpenAI conversation item created:', message.item?.type);
            } else if (message.type === 'error') {
              console.error('OpenAI error:', message.error);
            }
          });

          // Send initial greeting after a short delay
          setTimeout(() => {
            if (openaiClient && openaiClient.isConnected()) {
              openaiClient.sendGreeting();
            }
          }, 500);
        } else if (data.event === 'media' && openaiClient && openaiClient.isConnected()) {
          // Forward audio from Twilio to OpenAI
          const audioBuffer = Buffer.from(data.media.payload, 'base64');
          openaiClient.sendAudio(audioBuffer);
        } else if (data.event === 'stop') {
          console.log(`Media stream stopped for call ${callSid}`);
          
          if (openaiClient) {
            openaiClient.close();
          }
          
          // Update call record
          const calls = await storage.getAllCalls();
          const call = calls.find(c => c.callSid === callSid);
          if (call) {
            const duration = Math.floor((Date.now() - callStartTime) / 1000);
            await storage.updateCall(call.id, {
              status: 'completed',
              endTime: new Date(),
              duration,
            });
          }

          activeSessions.delete(callSid);

          // Broadcast call ended to UI
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'call_ended',
                callSid,
              }));
            }
          });
        }
      } catch (error) {
        console.error('Media stream error:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('Media stream WebSocket error:', error);
      if (openaiClient) {
        openaiClient.close();
      }
    });

    ws.on('close', () => {
      console.log('Media stream WebSocket closed');
      if (openaiClient) {
        openaiClient.close();
      }
      if (callSid) {
        activeSessions.delete(callSid);
      }
    });
  });

  // Twilio call status callback
  app.post('/api/twilio/status', async (req, res) => {
    try {
      const { CallSid, CallStatus, CallDuration } = req.body;
      
      const calls = await storage.getAllCalls();
      const call = calls.find(c => c.callSid === CallSid);
      
      if (call) {
        await storage.updateCall(call.id, {
          status: CallStatus,
          duration: parseInt(CallDuration) || null,
          endTime: ['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(CallStatus) 
            ? new Date() 
            : null,
        });
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Status callback error:', error);
      res.status(500).send('Error');
    }
  });

  // Call API endpoints
  app.get('/api/calls', async (_req, res) => {
    try {
      const calls = await storage.getAllCalls();
      res.json(calls);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch calls' });
    }
  });

  app.post('/api/calls', async (req, res) => {
    try {
      const data = insertCallSchema.parse(req.body);
      const call = await storage.createCall(data);
      res.json(call);
    } catch (error) {
      res.status(400).json({ error: 'Invalid call data' });
    }
  });

  // Booking API endpoints
  app.get('/api/bookings', async (_req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  });

  app.post('/api/bookings', async (req, res) => {
    try {
      const data = insertBookingSchema.parse(req.body);
      
      // Check for conflicts
      const existingBookings = await storage.getBookingsByDate(data.date);
      const hasConflict = existingBookings.some(
        (b) =>
          b.courtNumber === data.courtNumber &&
          b.status === 'confirmed' &&
          ((data.startTime >= b.startTime && data.startTime < b.endTime) ||
            (data.endTime > b.startTime && data.endTime <= b.endTime) ||
            (data.startTime <= b.startTime && data.endTime >= b.endTime))
      );

      if (hasConflict) {
        return res.status(409).json({ error: 'Court already booked for this time slot' });
      }

      const booking = await storage.createBooking(data);
      res.json(booking);
    } catch (error) {
      res.status(400).json({ error: 'Invalid booking data' });
    }
  });

  app.delete('/api/bookings/:id', async (req, res) => {
    try {
      await storage.deleteBooking(req.params.id);
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete booking' });
    }
  });

  // Settings API endpoints
  app.get('/api/settings', async (_req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.put('/api/settings', async (req, res) => {
    try {
      const data = insertClubSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(data);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: 'Invalid settings data' });
    }
  });

  return httpServer;
}
