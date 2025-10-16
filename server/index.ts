import express, { type Request, Response, NextFunction } from "express";
import expressWs from "express-ws";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import voiceRouter from "./voice";
import { startRealtime } from "./realtime";
import { WebSocketServer } from "ws";
import { setupRealtime } from "./realtime-handler"; // Handles OpenAI connection

const { app } = expressWs(express());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Normal routes ---
app.use("/", voiceRouter);

// --- Twilio /media-stream route (TwiML response) ---
app.post("/media-stream", (req: Request, res: Response) => {
  const wsUrl = "wss://tennis-voice-ai-rough-smoke-959.fly.dev/media-stream"; // ✅ Fixed for Fly.io

  console.log("📞 Incoming call hit the webhook");

  res.set("Content-Type", "text/xml");
  res.send(`
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="Polly.Joanna">Hi there! Connecting you to the AI receptionist now.</Say>
      <Pause length="1"/>
      <Connect>
        <Stream url="${wsUrl}" />
      </Connect>
    </Response>
  `);
});

// --- Async wrapper ---
(async () => {
  const server = await registerRoutes(app);

  // --- WebSocket handler for Twilio Realtime Stream ---
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    if (req.url === "/media-stream") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        console.log("🔗 Twilio Media Stream connected");
        setupRealtime(ws); // Connects Twilio <Stream> → OpenAI Realtime
      });
    } else {
      socket.destroy();
    }
  });

  // --- Optional OpenAI internal realtime handler ---
  startRealtime(server);

  // --- Error handling middleware ---
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("❌ Server error:", err);
  });

  // --- Vite setup (only for dev) ---
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // serveStatic(app);
  }

  // --- Launch server ---
  const port = parseInt(process.env.PORT || "8080", 10);
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`🚀 Server running on port ${port}`);
  });
})();
