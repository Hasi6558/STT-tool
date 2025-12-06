import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
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

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/ws`);

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

      clientWs.on("message", async (message) => {
        try {
          const data = JSON.parse(message.toString());

          // Initialize OpenAI WebSocket connection
          if (data.type === "init") {
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

                  // Now configure the session
                  openaiWs.send(
                    JSON.stringify({
                      type: "transcription_session.update",
                      session: {
                        input_audio_format: "pcm16",
                        input_audio_transcription: {
                          model: "gpt-4o-transcribe",
                          // Omit language to enable auto-detection
                        },
                        turn_detection: {
                          type: "server_vad",
                          threshold: 0.5,
                          prefix_padding_ms: 300,
                          silence_duration_ms: 500,
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
                  console.log("  previous_item_id:", response.previous_item_id);
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

          // Forward audio data to OpenAI
          if (data.type === "audio" && openaiWs && openaiWs.readyState === 1) {
            openaiWs.send(
              JSON.stringify({
                type: "input_audio_buffer.append",
                audio: data.audio,
              })
            );
          }

          // Handle stop recording
          if (data.type === "stop" && openaiWs) {
            openaiWs.close();
            openaiWs = null;
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
      });

      clientWs.on("error", (error) => {
        console.error("Client WebSocket error:", error);
      });
    });
  });
});
