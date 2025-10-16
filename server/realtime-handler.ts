import WebSocket from "ws";

// Diagnostic version: just keeps Twilio alive and proves the socket works
export function setupRealtime(ws: WebSocket) {
  console.log("🧠 setupRealtime() called — diagnostic mode");

  // Helper to send safely once socket is open
  const safeSend = (payload: any) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      console.log("⚠️ Tried to send but socket not open yet");
    }
  };

  // 1️⃣ Delay 500 ms to ensure Twilio’s handshake fully completes
  setTimeout(() => {
    safeSend({ event: "mark", mark: { name: "initial_ping" } });
    console.log("📡 Sent initial keep-alive ping (after delay)");
  }, 500);

  // 2️⃣ Send heartbeat pings every 2 s
  const keepAlive = setInterval(() => {
    safeSend({ event: "mark", mark: { name: "ping" } });
    console.log("🫀 Sent periodic keep-alive ping");
  }, 2000);

  // 3️⃣ Log any inbound events from Twilio
  ws.on("message", (msg) => {
    console.log("🎧 From Twilio:", msg.toString().slice(0, 200));
  });

  // 4️⃣ When the socket closes
  ws.on("close", (code, reason) => {
    console.log("❌ Twilio socket closed — code:", code, "reason:", reason.toString());
    clearInterval(keepAlive);
  });

  // 5️⃣ If an error occurs
  ws.on("error", (err) => {
    console.error("🔥 WebSocket error:", err);
    clearInterval(keepAlive);
  });
}
