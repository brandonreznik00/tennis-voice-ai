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
    ws.send(JSON.stringify({ event: "connected" }));

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.event === "start") console.log("🎯 Stream started");
        else if (data.event === "media") console.log("🎧 Audio packet received");
        else if (data.event === "stop") console.log("🛑 Stream stopped");
      } catch (err) {
        console.error("⚠️ Error handling Twilio message:", err);
      }
    });

    ws.on("close", () => console.log("❌ Media stream closed"));
  });

  // ✅ Optional: WebSocket for client dashboard
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", () => console.log("📡 Client WebSocket connected"));

  // ✅ Return server for Render
  return httpServer;
}

