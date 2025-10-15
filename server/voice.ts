import express, { Request, Response } from "express";
import twilio from "twilio";

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// POST route Twilio calls when a call starts
router.post("/", (req: Request, res: Response) => {
  const twiml = new VoiceResponse();

  // Simple greeting so Twilio doesn't hang up immediately
  twiml.say({ voice: "Polly.Joanna" }, "Hi there! Connecting you to the AI receptionist now.");

  // Tell Twilio to stream the audio to your WebSocket server
  const connect = twiml.connect();
  connect.stream({
    url: "wss://tennis-voice-ai.onrender.com/media-stream",
  });

  res.type("text/xml");
  res.send(twiml.toString());
});

export default router;
