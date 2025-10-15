import twilio from "twilio";
import { Request, Response } from "express";

const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * Handles incoming Twilio voice webhooks.
 * Responds with TwiML instructing Twilio to open a WebSocket media stream.
 */
export function handleVoice(req: Request, res: Response) {
  const twiml = new VoiceResponse();

  const connect = twiml.connect();
  connect.stream({
    url: "wss://tennis-voice-ai.onrender.com/media-stream",
  });

  res.type("text/xml");
  res.send(twiml.toString());
}

export default handleVoice;
