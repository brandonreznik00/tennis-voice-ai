import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import handleVoice from "./voice.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // ✅ Create the HTTP + WebSocket server
  const httpServer = createServer(app);

  // ✅ Twilio incoming call webhook
  app.post("/api/twilio/incoming", handleVoice);

  // ✅ Twilio Media Stream endpoint
  const mediaWss = new WebSocketServer({ server: httpServer, path: "/media-stream" });
mediaWss.on("connection", (ws) => {
  console.log("✅ Twilio Media Stream connected!");

  // 👇 Immediately acknowledge connection to Twilio
  ws.send(JSON.stringify({ event: "connected" }));

  let lastPing = Date.now();

  // 🟢 Keepalive every 5s to prevent timeout
  const pingInterval = setInterval(() => {
    if (Date.now() - lastPing > 15000) {
      console.log("⚠️ No audio for 15s — closing stream.");
      ws.close();
      clearInterval(pingInterval);
    } else if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ event: "mark", name: "keepalive" }));
    }
  }, 5000);

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.event === "start") {
        console.log("🎯 Stream started:", data.start.streamSid);
      } else if (data.event === "media") {
        lastPing = Date.now();
        // Optional: log audio packet sizes
        // const audio = Buffer.from(data.media.payload, "base64");
        // console.log("🎧 Audio:", audio.length);
      } else if (data.event === "stop") {
        console.log("🛑 Stream stopped");
        clearInterval(pingInterval);
        ws.close();
      }
    } catch (err) {
      console.error("⚠️ Error parsing Twilio message:", err);
    }
  });

  ws.on("close", () => {
    clearInterval(pingInterval);
    console.log("❌ Media stream closed");
  });
});


  // ✅ Optional: WebSocket for client dashboard
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", () => console.log("📡 Client WebSocket connected"));

  // ✅ Return server for Render
  return httpServer;
}

