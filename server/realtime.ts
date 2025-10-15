import { WebSocketServer } from "ws";
import OpenAI from "openai";

export const startRealtime = (server: any) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", async (ws) => {
    const ai = await openai.realtime.connect({
      model: "gpt-4o-realtime-preview",
      voice: "alloy",
      instructions: "You are Emma, a friendly tennis club receptionist.",
    });

    ws.on("message", (msg) => ai.send(msg));
    ai.on("message", (msg) => ws.send(msg));
    ws.on("close", () => ai.close());
  });

  server.on("upgrade", (req, socket, head) => {
    if (req.url === "/media-stream") {
      wss.handleUpgrade(req, socket, head, (ws) =>
        wss.emit("connection", ws, req)
      );
    }
  });
};
