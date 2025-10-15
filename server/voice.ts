import twilio from "twilio";
import { Request, Response } from "express";

const VoiceResponse = twilio.twiml.VoiceResponse;

export const handleVoice = (req: Request, res: Response) => {
  const twiml = new VoiceResponse();

  // Tell Twilio to stream live audio to your WebSocket
  const connect = twiml.connect();
  connect.stream({
    url: "wss://tennis-voice-ai.onrender.com/media-stream", // ✅ no /api prefix
  });

  res.type("text/xml");
  res.send(twiml.toString());
};

export default handleVoice;
