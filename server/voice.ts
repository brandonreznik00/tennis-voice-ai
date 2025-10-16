import twilio from "twilio";
import { Request, Response } from "express";

const VoiceResponse = twilio.twiml.VoiceResponse;

export const handleVoice = (req: Request, res: Response) => {
const twiml = new VoiceResponse();
twiml.say({ voice: "Polly.Joanna" }, "Hi there! Connecting you to the AI receptionist now.");
twiml.pause({ length: 1 });


  const connect = twiml.connect();
  connect.stream({
    url: "wss://tennis-voice-ai.onrender.com/media-stream",
  });

  res.type("text/xml");
  res.send(twiml.toString());
};

export default handleVoice;
