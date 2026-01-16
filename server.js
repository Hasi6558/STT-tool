import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // Always bind to 0.0.0.0 for cloud deployments
const port = parseInt(process.env.PORT || "3000", 10);

console.log(`[Server] Starting in ${dev ? "development" : "production"} mode`);
console.log(`[Server] Will bind to ${hostname}:${port}`);
console.log(`[Server] PORT env var: ${process.env.PORT}`);
console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);

const app = next({
  dev,
  hostname: "0.0.0.0",
  port,
  customServer: true,
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // Handle ephemeral token endpoint
      if (pathname === "/api/realtime/token" && req.method === "POST") {
        try {
          const response = await fetch(
            "https://api.openai.com/v1/realtime/transcription_sessions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-4o-transcribe",
                voice: "alloy",
              }),
            }
          );

          const data = await response.json();

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(data));
        } catch (error) {
          console.error("Error generating ephemeral token:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Failed to generate token" }));
        }
      } else {
        // Let Next.js handle all other requests
        await handle(req, res, parsedUrl);
      }
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  server.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`✓ Server successfully listening on 0.0.0.0:${port}`);
    console.log(`✓ WebSocket server ready on ws://0.0.0.0:${port}/ws`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`✓ Internal port configured: 3000`);
    console.log(`✓ Listening on all interfaces (0.0.0.0)`);
    console.log(`✓ Ready to accept connections from Fly.io proxy`);

    // Health check endpoint is available
    console.log(`✓ Health check: GET /`);

    // Set up WebSocket server AFTER HTTP server is listening
    // This ensures Next.js HMR is already set up
    const wss = new WebSocketServer({
      noServer: true,
    });

    // Add our upgrade handler
    server.on("upgrade", (request, socket, head) => {
      const { pathname } = parse(request.url);

      if (pathname === "/ws") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      }
      // For other paths, do nothing - let existing handlers work
    });

    wss.on("connection", (clientWs) => {
      console.log("Client connected to WebSocket server");

      let openaiWs = null;
      let deepgramConnection = null;
      let currentMode = null; // 'sentence' or 'realtime'

      clientWs.on("message", async (message) => {
        try {
          const data = JSON.parse(message.toString());

          // Initialize transcription connection based on mode
          if (data.type === "init") {
            currentMode = data.mode || "sentence"; // Default to sentence mode
            console.log(`Initializing ${currentMode} mode transcription`);

            if (currentMode === "realtime") {
              // ===== DEEPGRAM REALTIME MODE =====
              const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

              if (!deepgramApiKey) {
                clientWs.send(
                  JSON.stringify({
                    type: "error",
                    message: "Deepgram API key not configured",
                  })
                );
                return;
              }

              try {
                const deepgram = createClient(deepgramApiKey);

                deepgramConnection = deepgram.listen.live({
                  model: "nova-3",
                  language: "en",
                  smart_format: true,
                  interim_results: true,
                  endpointing: 300, // Slightly longer endpointing for better sentence detection
                  punctuate: true,
                  encoding: "linear16",
                  sample_rate: 24000,
                  channels: 1,
                });

                deepgramConnection.on(LiveTranscriptionEvents.Open, () => {
                  console.log("Connected to Deepgram");
                  clientWs.send(
                    JSON.stringify({
                      type: "ready",
                      message: "Connected to Deepgram transcription service",
                    })
                  );
                });

                deepgramConnection.on(
                  LiveTranscriptionEvents.Transcript,
                  (transcriptData) => {
                    if (transcriptData.channel?.alternatives?.[0]) {
                      const transcript =
                        transcriptData.channel.alternatives[0].transcript;
                      const isFinal = transcriptData.is_final;
                      const speechFinal = transcriptData.speech_final;

                      if (transcript) {
                        console.log(
                          `[Deepgram] ${
                            isFinal ? "FINAL" : "Interim"
                          }: ${transcript}`
                        );

                        // Send transcript to client
                        clientWs.send(
                          JSON.stringify({
                            type: "deepgram_transcript",
                            transcript: transcript,
                            is_final: isFinal,
                            speech_final: speechFinal,
                          })
                        );
                      }
                    }
                  }
                );

                deepgramConnection.on(
                  LiveTranscriptionEvents.SpeechStarted,
                  () => {
                    console.log("[Deepgram] Speech started");
                    clientWs.send(
                      JSON.stringify({
                        type: "deepgram_speech_started",
                      })
                    );
                  }
                );

                deepgramConnection.on(
                  LiveTranscriptionEvents.UtteranceEnd,
                  () => {
                    console.log("[Deepgram] Utterance end");
                    clientWs.send(
                      JSON.stringify({
                        type: "deepgram_utterance_end",
                      })
                    );
                  }
                );

                deepgramConnection.on(LiveTranscriptionEvents.Close, () => {
                  console.log("Deepgram connection closed");
                  clientWs.send(
                    JSON.stringify({
                      type: "disconnected",
                      message: "Deepgram transcription service disconnected",
                    })
                  );
                });

                deepgramConnection.on(
                  LiveTranscriptionEvents.Error,
                  (error) => {
                    console.error("Deepgram error:", error);
                    clientWs.send(
                      JSON.stringify({
                        type: "error",
                        message: "Deepgram connection error",
                      })
                    );
                  }
                );
              } catch (error) {
                console.error("Error initializing Deepgram:", error);
                clientWs.send(
                  JSON.stringify({
                    type: "error",
                    message: "Failed to initialize Deepgram connection",
                  })
                );
              }
            } else {
              // ===== OPENAI SENTENCE MODE =====
              const apiKey = process.env.OPENAI_API_KEY;

              if (!apiKey) {
                clientWs.send(
                  JSON.stringify({
                    type: "error",
                    message: "OpenAI API key not configured",
                  })
                );
                return;
              }

              // Connect to OpenAI Realtime API with transcription intent
              const WebSocket = (await import("ws")).default;
              openaiWs = new WebSocket(
                "wss://api.openai.com/v1/realtime?intent=transcription",
                {
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "OpenAI-Beta": "realtime=v1",
                  },
                }
              );

              let sessionId = null;

              openaiWs.on("open", () => {
                console.log("Connected to OpenAI Realtime API");
                // Don't send configuration immediately, wait for session.created
              });

              openaiWs.on("message", (message) => {
                try {
                  const response = JSON.parse(message.toString());
                  console.log("Received from OpenAI:", response.type);

                  // Capture session ID and configure transcription
                  if (response.type === "transcription_session.created") {
                    sessionId = response.session.id;
                    console.log("  Session ID:", sessionId);

                    // Now configure the session with optimized settings
                    openaiWs.send(
                      JSON.stringify({
                        type: "transcription_session.update",
                        session: {
                          input_audio_format: "pcm16",
                          input_audio_transcription: {
                            model: "gpt-4o-transcribe",
                            language: "en", // English only for better accuracy
                          },
                          turn_detection: {
                            type: "server_vad",
                            threshold: 0.6, // Increased threshold for less false positives
                            prefix_padding_ms: 200, // Reduced padding for faster detection
                            silence_duration_ms: 400, // Shorter silence for quicker turn detection
                          },
                          input_audio_noise_reduction: {
                            type: "near_field",
                          },
                          include: ["item.input_audio_transcription.logprobs"],
                        },
                      })
                    );

                    clientWs.send(
                      JSON.stringify({
                        type: "ready",
                        message: "Connected to transcription service",
                      })
                    );
                  }

                  // Log errors for debugging
                  if (response.type === "error") {
                    console.error(
                      "  OpenAI Error:",
                      JSON.stringify(response.error, null, 2)
                    );
                  }

                  // Log important ordering information for debugging
                  if (response.type === "input_audio_buffer.committed") {
                    console.log("  item_id:", response.item_id);
                    console.log(
                      "  previous_item_id:",
                      response.previous_item_id
                    );
                  }

                  // Log all conversation item events for debugging
                  if (response.type?.startsWith("conversation.item")) {
                    console.log(
                      "  Full event:",
                      JSON.stringify(response, null, 2)
                    );
                  }

                  // Forward ALL events to client for now to debug
                  clientWs.send(JSON.stringify(response));
                } catch (error) {
                  console.error("Error parsing OpenAI message:", error);
                }
              });

              openaiWs.on("error", (error) => {
                console.error("OpenAI WebSocket error:", error);
                clientWs.send(
                  JSON.stringify({
                    type: "error",
                    message: "OpenAI connection error",
                  })
                );
              });

              openaiWs.on("close", () => {
                console.log("OpenAI WebSocket closed");
                clientWs.send(
                  JSON.stringify({
                    type: "disconnected",
                    message: "Transcription service disconnected",
                  })
                );
              });
            }
          }

          // Forward audio data based on current mode
          if (data.type === "audio") {
            if (
              currentMode === "realtime" &&
              deepgramConnection &&
              deepgramConnection.getReadyState() === 1
            ) {
              // Deepgram expects raw audio buffer, not base64
              const audioBuffer = Buffer.from(data.audio, "base64");
              deepgramConnection.send(audioBuffer);
            } else if (
              currentMode === "sentence" &&
              openaiWs &&
              openaiWs.readyState === 1
            ) {
              openaiWs.send(
                JSON.stringify({
                  type: "input_audio_buffer.append",
                  audio: data.audio,
                })
              );
            }
          }

          // Handle stop recording
          if (data.type === "stop") {
            if (openaiWs) {
              openaiWs.close();
              openaiWs = null;
            }
            if (deepgramConnection) {
              deepgramConnection.finish();
              deepgramConnection = null;
            }
            currentMode = null;
          }
        } catch (error) {
          console.error("Error handling client message:", error);
          clientWs.send(
            JSON.stringify({
              type: "error",
              message: error.message,
            })
          );
        }
      });

      clientWs.on("close", () => {
        console.log("Client disconnected");
        if (openaiWs) {
          openaiWs.close();
          openaiWs = null;
        }
        if (deepgramConnection) {
          deepgramConnection.finish();
          deepgramConnection = null;
        }
      });

      clientWs.on("error", (error) => {
        console.error("Client WebSocket error:", error);
      });
    });
  });
});
