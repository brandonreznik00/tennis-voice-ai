import WebSocket from "ws";
import fetch from "node-fetch";

// Handles each incoming Twilio audio stream connection
export function setupRealtime(ws: WebSocket) {
  console.log("🧠 Realtime session started");

  // Create a connection to OpenAI Realtime API
  const openaiWs = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17", {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "OpenAI-Beta": "realtime=v1",
    },
  });

  openaiWs.on("open", () => console.log("🔗 Connected to OpenAI Realtime API"));
  openaiWs.on("message", (msg) => {
    console.log("💬 From OpenAI:", msg.toString());
    // TODO: forward audio response back to Twilio here
  });

  ws.on("message", (msg) => {
    // Forward audio data from Twilio to OpenAI
    openaiWs.send(msg);
  });

  ws.on("close", () => {
    console.log("❌ Twilio WebSocket closed");
    openaiWs.close();
  });
}
