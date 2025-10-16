import WebSocket from "ws";

export function setupRealtime(ws: WebSocket) {
  console.log("🧠 Diagnostic setupRealtime() called — keeping Twilio alive");

  // 1️⃣  Send one immediate message so Twilio knows we’re alive
  try {
    ws.send(JSON.stringify({ event: "mark", mark: { name: "initial_ping" } }));
    console.log("📡 Sent initial keep-alive ping");
  } catch (err) {
    console.error("❌ Could not send initial ping:", err);
  }

  // 2️⃣  Keep sending “mark” events every 2 seconds
  const keepAlive = setInterval(() => {
    try {
      ws.send(JSON.stringify({ event: "mark", mark: { name: "ping" } }));
      console.log("🫀 Sent periodic keep-alive ping");
    } catch (err) {
      console.error("❌ Keep-alive failed:", err);
      clearInterval(keepAlive);
    }
  }, 2000);

  // 3️⃣  Log everything Twilio sends us
  ws.on("message", (msg) => {
    console.log("🎧 From Twilio:", msg.toString().slice(0, 200));
  });

  // 4️⃣  Handle close events
  ws.on("close", (code, reason) => {
    console.log("❌ Twilio socket closed — code:", code, "reason:", reason.toString());
    clearInterval(keepAlive);
  });
}
