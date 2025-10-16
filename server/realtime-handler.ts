import WebSocket from "ws";

// Handles each incoming Twilio audio stream connection
export function setupRealtime(ws: WebSocket) {
  console.log("🧠 Starting AI receptionist session...");

  // 🔁 Twilio requires some activity or it will hang up.
  const keepAlive = setInterval(() => {
    try {
      ws.send(JSON.stringify({ event: "mark", mark: { name: "ping" } }));
      console.log("🫀 Sent keep-alive ping to Twilio");
    } catch (err) {
      clearInterval(keepAlive);
    }
  }, 2000);

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

    // Initial AI greeting
    openaiWs.send(
      JSON.stringify({
        type: "response.create",
        response: {
          instructions:
            "You are a friendly AI receptionist for a tennis club. Greet the caller, ask how you can help, and reply naturally in short, conversational sentences.",
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

  // 🎧 Handle incoming audio/events from Twilio
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.event === "media") {
        // Caller’s audio chunks (base64 PCM16) → OpenAI
        openaiWs.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: data.media.payload,
          })
        );
      } else if (data.event === "mark" || data.event === "stop") {
        // Tell OpenAI to start responding
        openaiWs.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
        openaiWs.send(JSON.stringify({ type: "response.create" }));
      }
    } catch (err) {
      console.error("⚠️ Error parsing Twilio message:", err);
    }
  });

  // 🔊 Handle AI → Twilio audio stream
  openaiWs.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      // Send OpenAI’s audio response chunks to Twilio
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

  // 🧹 Clean up connections
  ws.on("close", () => {
    console.log("❌ Twilio socket closed.");
    clearInterval(keepAlive);
    openaiWs.close();
  });

  openaiWs.on("close", () => {
    console.log("🛑 OpenAI socket closed.");
    clearInterval(keepAlive);
  });
}
