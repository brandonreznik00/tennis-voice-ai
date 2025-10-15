// server/voice.ts
import express from "express";
import twilio from "twilio";
import { Request, Response } from "express";

const router = express.Router();

router.post("/", (req: Request, res: Response) => {
  const twiml = new twilio.twiml.VoiceResponse();

  // Tell Twilio to stream audio to your Render WebSocket endpoint
  const connect = twiml.connect();
  connect.stream({
    url: "wss://tennis-voice-ai.onrender.com/media-stream",
  });

  res.type("text/xml");
  res.send(twiml.toString());
});

export default router;
