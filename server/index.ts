import express, { type Request, Response, NextFunction } from "express";
import expressWs from "express-ws";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import voiceRouter from "./voice";
import { startRealtime } from "./realtime";
import { WebSocketServer } from "ws"; // ✅ Added import

const { app } = expressWs(express());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Normal routes ---
app.use("/", voiceRouter);

// --- Twilio /media-stream route (HTTP endpoint) ---
app.post("/media-stream", (req: Request, res: Response) => {
  res.set("Content-Type", "text/xml");
  res.send(`
    <Response>
      <Connect>
        <Stream url="wss://${req.hostname}/media-stream" />
      </Connect>
    </Response>
  `);
});

(async () => {
  const server = await registerRoutes(app);

  // --- WebSocket handler for Twilio Realtime Stream ---
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    if (req.url === "/media-stream") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        console.log("🔗 Twilio WebSocket connected");
        ws.on("message", (msg) => console.log("🎧 Received:", msg.toString()));
        ws.on("close", () => console.log("❌ Twilio WebSocket disconnected"));
      });
    } else {
      socket.destroy();
    }
  });

  // --- Start OpenAI or Realtime logic ---
  startRealtime(server);

  // --- Error handler ---
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // --- Vite setup (dev vs prod) ---
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // serveStatic(app);
  }

  // --- Launch server ---
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`🚀 Server running on port ${port}`);
  });
})();
