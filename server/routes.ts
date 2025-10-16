import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import handleVoice from "./voice.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // ✅ Create HTTP + WebSocket server
  const httpServer = createServer(app);

  // ✅ Twilio incoming webhook
  app.post("/api/twilio/incoming", handleVoice);

  // ✅ Twilio Media Stream WebSocket endpoint
  const mediaWss = new WebSocketServer({ server: httpServer, path: "/media-stream" });

mediaWss.on("connection", (ws, req) => {
  console.log("✅ Twilio Media Stream CONNECTED from", req.socket.remoteAddress);

    // ✅ Send connection ACK (Twilio requires this immediately)
    ws.send(JSON.stringify({ event: "connected" }));

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());

        if (data.event === "start") {
          console.log("🎯 Stream started:", data.start.streamSid);
        } else if (data.event === "media") {
          // Media packets come in ~20x/sec
          // You can later pipe this to OpenAI Realtime or Deepgram
          console.log("🎧 Audio packet received:", data.media.payload.length);
          // Keep alive acknowledgment
          ws.send(JSON.stringify({ event: "mark", name: "keepalive" }));
        } else if (data.event === "stop") {
          console.log("🛑 Stream stopped by Twilio");
        }
      } catch (err) {
        console.error("⚠️ Error handling Twilio message:", err);
      }
    });

    ws.on("close", () => {
      console.log("❌ Media stream closed");
    });
  });

  // ✅ Optional: WebSocket for internal client/dashboard connections
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", () => console.log("📡 Client WebSocket connected"));

  // ✅ Return server for Render
  return httpServer;
}
