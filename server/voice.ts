// server/voice.ts
import { Request, Response } from "express";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

// ✅ Handles incoming calls from Twilio
export const handleVoice = (req: Request, res: Response) => {
  const twiml = new VoiceResponse();

  // Create <Connect><Stream> so Twilio sends live audio
  const connect = twiml.connect();
  connect.stream({
    url: "wss://tennis-voice-ai.onrender.com/media-stream", // this WebSocket will handle the AI side
  });

  res.type("text/xml");
  res.send(twiml.toString());
};

export default { handleVoice };
