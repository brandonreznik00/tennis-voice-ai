import twilio from "twilio";
import { Request, Response } from "express";

const VoiceResponse = twilio.twiml.VoiceResponse;

export const handleVoice = (req: Request, res: Response) => {
  const twiml = new VoiceResponse();

  // 👋 Small intro so Twilio doesn’t instantly hang up
  twiml.say({ voice: "Polly.Joanna" }, "Hi there! Connecting you to the A I receptionist now.");

  // 🎧 Connect to your WebSocket media stream
  const connect = twiml.connect();
connect.stream({
  url: "wss://tennis-voice-ai.onrender.com/media-stream",
  track: "inbound_track",
});


  // ✅ Respond to Twilio
  res.type("text/xml");
  res.send(twiml.toString());
};

export default handleVoice;
