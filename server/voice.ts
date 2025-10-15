import express from "express";
const router = express.Router();

router.post("/voice", (req, res) => {
  res.type("text/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="Polly.Joanna">
        Hi there! You’ve reached the AI Tennis Club receptionist.
        How can I help you today?
      </Say>
      <Pause length="3"/>
      <Say>If you’d like to book a court, please say 'book court' after the beep.</Say>
      <Record maxLength="30" playBeep="true"/>
    </Response>`);
});


export default router;
