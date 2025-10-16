import WebSocket from "ws";

export class OpenAIRealtimeClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private sessionId: string | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
      
      this.ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "OpenAI-Beta": "realtime=v1",
        },
      });

      this.ws.on("open", () => {
        console.log("Connected to OpenAI Realtime API");
        resolve();
      });

      this.ws.on("error", (error) => {
        console.error("OpenAI WebSocket error:", error);
        reject(error);
      });

      this.ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === "session.created") {
            this.sessionId = message.session.id;
          }
        } catch (error) {
          console.error("Error parsing OpenAI message:", error);
        }
      });
    });
  }

  configureSession(instructions: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    this.ws.send(
      JSON.stringify({
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          instructions: instructions,
          voice: "alloy",
          input_audio_format: "g711_ulaw",
          output_audio_format: "g711_ulaw",
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        },
      })
    );
  }

  sendAudio(audioData: Buffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: "input_audio_buffer.append",
        audio: audioData.toString("base64"),
      })
    );
  }

  commitAudioBuffer() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: "input_audio_buffer.commit",
      })
    );
  }

  createResponse() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: "response.create",
      })
    );
  }

  sendGreeting() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Send initial greeting when call starts
    this.ws.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Hello",
            },
          ],
        },
      })
    );

    this.createResponse();
  }

  onMessage(callback: (message: any) => void) {
    if (this.ws) {
      this.ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          callback(message);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      });
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
