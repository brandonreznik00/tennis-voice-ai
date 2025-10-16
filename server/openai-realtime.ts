import WebSocket from "ws";

// Handles each incoming Twilio audio stream connection
export function setupRealtime(ws: WebSocket) {
  console.log("🧠 setupRealtime() called — starting Twilio ping loop");

  // 🔁 Keep Twilio stream alive so it doesn't hang up
  const keepAlive = setInterval(() => {
    try {
      ws.send(JSON.stringify({ event: "mark", mark: { name: "ping" } }));
      console.log("🫀 Sent keep-alive ping to Twilio");
    } catch (err) {
      clearInterval(keepAlive);
    }
  }, 2000);

  // 🟢 Send one immediate ping when connection opens
  try {
    ws.send(JSON.stringify({ event: "mark", mark: { name: "initial_ping" } }));
    console.log("📡 Sent initial keep-alive to Twilio");
  } catch (err) {
    console.error("Ping error:", err);
  }

  // 🧠 Connect to OpenAI Realtime API
  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
    }
  );

  openaiWs.on("open", () => {
    console.log("🔗 Connected to OpenAI Realtime API");

    // Optional: send an initial greeting
    openaiWs.send(
      JSON.stringify({
        type: "response.create",
        response: {
          instructions:
            "You are a friendly AI receptionist for a tennis club. Greet the caller, ask how you can help, and speak naturally in short sentences.",
          modalities: ["audio"],
          audio_format: "wav",
          voice: "alloy",
        },
      })
    );
  });

  openaiWs.on("error", (err) => {
    console.error("❌ OpenAI WebSocket error:", err);
  });

  // 🎧 Incoming events from Twilio
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.event === "media") {
        // Forward caller audio to OpenAI
        openaiWs.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: data.media.payload,
          })
        );
      } else if (data.event === "mark" || data.event === "stop") {
        // Tell OpenAI to respond
        openaiWs.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
        openaiWs.send(JSON.stringify({ type: "response.create" }));
      }
    } catch (err) {
      console.error("⚠️ Error parsing Twilio message:", err);
    }
  });

  // 🔊 OpenAI → Twilio audio stream
  openaiWs.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.type === "response.output_audio.delta" && data.delta) {
        ws.send(
          JSON.stringify({
            event: "media",
            media: { payload: data.delta },
          })
        );
      }

      if (data.type === "response.completed") {
        console.log("✅ AI finished speaking.");
      }
    } catch (err) {
      console.error("⚠️ Error parsing OpenAI response:", err);
    }
  });

  // 🧹 Connection cleanup + diagnostics
  ws.on("close", (code, reason) => {
    console.log("❌ Twilio socket closed — code:", code, "reason:", reason.toString());
    clearInterval(keepAlive);
    openaiWs.close();
  });

  openaiWs.on("close", () => {
    console.log("🛑 OpenAI socket closed.");
    clearInterval(keepAlive);
  });
}
