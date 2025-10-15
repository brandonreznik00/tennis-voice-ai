import twilio from "twilio";
import { Request, Response } from "express";

const VoiceResponse = twilio.twiml.VoiceResponse;

export const handleVoice = (req: Request, res: Response) => {
  const twiml = new VoiceResponse();
  const connect = twiml.connect();

  // ✅ use the exact same path as your WebSocketServer
  connect.stream({ url: "wss://tennis-voice-ai.onrender.com/media-stream" });

  res.type("text/xml");
  res.send(twiml.toString());
};


export default handleVoice;
