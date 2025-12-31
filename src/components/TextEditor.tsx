"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faMicrophoneLines,
  faMicrophoneLinesSlash,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowRightFromLine, Mic, Text } from "lucide-react";
import { Arrow } from "@radix-ui/react-tooltip";
import ArrowButton from "./ArrowButton";

interface TextEditorProps {
  isMicSectionOpen: boolean;
  setIsMicSectionOpen: (value: boolean) => void;
  accumulatedTranscript: string;
  setAccumulatedTranscript: (value: string) => void;
}

export default function TextEditor({
  isMicSectionOpen,
  setIsMicSectionOpen,
  accumulatedTranscript,
  setAccumulatedTranscript,
}: TextEditorProps) {
  const [isMicOn, setIsMicOn] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [status, setStatus] = useState<string>("Ready");
  const [isMicConnected, setIsMicConnected] = useState<boolean>(false);

  const cursorRef = useRef<number | null>(null);

  const textRef = useRef(accumulatedTranscript);

  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<{ stop: () => void; state: string } | null>(
    null
  );
  const audioContextRef = useRef<AudioContext | null>(null);

  const transcriptItemsRef = useRef<
    Map<
      string,
      {
        text: string;
        previousItemId: string | null;
      }
    >
  >(new Map());
  const currentItemIdRef = useRef<string | null>(null);

  useEffect(() => {
    textRef.current = accumulatedTranscript;
  }, [accumulatedTranscript]);

  useEffect(() => {
    // Check for microphone availability on component mount (guard for server and unsupported browsers)
    const checkMicrophoneAccess = async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        setIsMicConnected(false);
        return;
      }

      try {
        if (typeof navigator.mediaDevices.enumerateDevices !== "function") {
          setIsMicConnected(false);
          return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMicrophone = devices.some(
          (device) => device.kind === "audioinput"
        );
        setIsMicConnected(hasMicrophone);
      } catch (error) {
        console.error("Error checking microphone:", error);
        setIsMicConnected(false);
      }
    };

    // Only run checks in a browser environment
    if (typeof window !== "undefined") {
      checkMicrophoneAccess();

      // Listen for device changes (only if supported)
      const handleDeviceChange = () => {
        checkMicrophoneAccess();
      };

      if (
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.addEventListener === "function"
      ) {
        navigator.mediaDevices.addEventListener(
          "devicechange",
          handleDeviceChange
        );

        return () => {
          // Cleanup on unmount
          try {
            navigator.mediaDevices.removeEventListener(
              "devicechange",
              handleDeviceChange
            );
          } catch (e) {
            // ignore
          }

          if (wsRef.current) {
            wsRef.current.close();
          }
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }
          if (audioContextRef.current) {
            audioContextRef.current.close();
          }
        };
      }
    }

    // If devicechange isn't supported, still return a cleanup that closes resources
    if (
      typeof window !== "undefined" &&
      (!navigator.mediaDevices ||
        typeof navigator.mediaDevices.addEventListener !== "function")
    ) {
      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    }
  }, []);

  // Helper function to rebuild transcript in correct order
  const rebuildTranscript = () => {
    const items = transcriptItemsRef.current;
    if (items.size === 0) return "";

    // Build a map of item_id -> next_item_id
    const nextMap = new Map<string, string>();
    let firstItemId: string | null = null;

    items.forEach((item, itemId) => {
      if (item.previousItemId) {
        nextMap.set(item.previousItemId, itemId);
      } else {
        firstItemId = itemId;
      }
    });

    // Traverse in order
    const orderedTexts: string[] = [];
    let currentId: string | null = firstItemId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const item = items.get(currentId);
      if (item && item.text) {
        orderedTexts.push(item.text);
      }
      currentId = nextMap.get(currentId) || null;
    }

    return orderedTexts.join(" ");
  };

  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Always use the most recent cursor position
    const start = cursorRef.current ?? textarea.value.length;
    const end = start;

    // CRITICAL: Use textRef.current as the source of truth, not textarea.value
    // This ensures we always work with the most up-to-date text
    const fullText = textRef.current ?? "";

    const newText = fullText.slice(0, start) + text + " " + fullText.slice(end);

    // Update ref FIRST (synchronously)
    textRef.current = newText;

    // Then update state
    setAccumulatedTranscript(newText);

    // Update cursor position immediately (synchronously, not in RAF)
    const newPos = start + text.length + 1;
    cursorRef.current = newPos;

    // Update textarea selection in next frame
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = newPos;
    });
  };

  const startRecording = async () => {
    try {
      setStatus("Initializing...");

      // Save cursor position before starting recording
      if (textareaRef.current) {
        cursorRef.current = textareaRef.current.selectionStart;
      }

      // Clear current session transcript items but keep accumulated transcript
      transcriptItemsRef.current.clear();
      currentItemIdRef.current = null;
      setTranscript("");

      // Request microphone access (guard for environments without mediaDevices)
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        setStatus("Microphone not available");
        setIsMicConnected(false);
        setIsMicOn(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Monitor microphone connection status
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        setIsMicConnected(true);
        audioTrack.onended = () => {
          console.log("Microphone disconnected");
          setIsMicConnected(false);
          setStatus("Microphone disconnected");
          stopRecording();
        };
      }

      // Create WebSocket connection with dynamic URL for production
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setStatus("Connecting to transcription service...");

        // Initialize transcription session
        ws.send(JSON.stringify({ type: "init" }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received:", data);

        switch (data.type) {
          case "ready":
            setStatus("Recording...");
            break;

          case "input_audio_buffer.committed":
            // Speech chunk detected and committed
            // Track the item_id and previous_item_id for ordering
            if (data.item_id) {
              currentItemIdRef.current = data.item_id;
              transcriptItemsRef.current.set(data.item_id, {
                text: "",
                previousItemId: data.previous_item_id || null,
              });
              console.log(
                `Committed item: ${data.item_id}, previous: ${data.previous_item_id}`
              );
            }
            setStatus("Processing speech...");
            break;

          case "conversation.item.input_audio_transcription.delta":
            // Real-time transcription updates for current item
            if (data.delta && data.item_id) {
              const currentItem = transcriptItemsRef.current.get(data.item_id);
              if (currentItem) {
                currentItem.text += data.delta;
              } else {
                // Item not tracked yet, create it
                transcriptItemsRef.current.set(data.item_id, {
                  text: data.delta,
                  previousItemId: null,
                });
              }
            }
            break;

          case "conversation.item.input_audio_transcription.completed":
            if (data.transcript) {
              insertTextAtCursor(data.transcript);
            }
            setStatus("Recording...");
            break;

          case "input_audio_buffer.speech_started":
            setStatus("Speech detected...");
            break;

          case "input_audio_buffer.speech_stopped":
            setStatus("Processing...");
            break;

          case "conversation.item.created":
            // Handle item created event which may contain transcript
            console.log("Item created:", data);
            if (data.item?.id) {
              const itemId = data.item.id;
              // Check if this item has a transcript in content
              if (data.item.content && Array.isArray(data.item.content)) {
                for (const content of data.item.content) {
                  console.log("Content item:", content);
                  if (content.type === "input_audio" && content.transcript) {
                    console.log(
                      "Found transcript in item.created:",
                      content.transcript
                    );
                    const item = transcriptItemsRef.current.get(itemId);
                    if (item) {
                      item.text = content.transcript;
                      setTranscript(rebuildTranscript());
                      setStatus("Recording...");
                    } else {
                      // Item not tracked yet, add it with data from event
                      transcriptItemsRef.current.set(itemId, {
                        text: content.transcript,
                        previousItemId: data.previous_item_id || null,
                      });
                      setTranscript(rebuildTranscript());
                      setStatus("Recording...");
                    }
                  }
                }
              }
            }
            break;

          case "transcription_session.created":
          case "transcription_session.updated":
            // Session events - no action needed, just acknowledged
            console.log("Session event:", data.type);
            break;

          case "error":
            console.error("WebSocket error:", data.message);
            setStatus(`Error: ${data.message}`);
            break;

          case "disconnected":
            setStatus("Disconnected");
            break;

          default:
            // Log unhandled events for debugging
            console.log("Unhandled event type:", data.type);
            break;
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus("Connection error");
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        setStatus("Disconnected");
      };

      // Set up audio processing with optimized buffer size
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      // Use 8192 buffer for better performance (larger chunks, less frequent processing)
      const processor = audioContext.createScriptProcessor(8192, 1, 1);

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);

          // Convert Float32Array to Int16Array (PCM16) - optimized
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            // Clamp and convert in one operation
            const sample = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
          }

          // Convert to base64 using optimized method
          const uint8Array = new Uint8Array(pcm16.buffer);
          let binary = "";
          const chunkSize = 0x8000; // Process in chunks to avoid stack overflow
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            binary += String.fromCharCode.apply(
              null,
              Array.from(uint8Array.subarray(i, i + chunkSize))
            );
          }
          const base64Audio = btoa(binary);

          // Send audio data to server
          ws.send(
            JSON.stringify({
              type: "audio",
              audio: base64Audio,
            })
          );
        }
      };

      // Store for cleanup
      mediaRecorderRef.current = {
        stop: () => {
          processor.disconnect();
          source.disconnect();
          stream.getTracks().forEach((track) => track.stop());
        },
        state: "recording",
      };

      setIsMicOn(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setIsMicOn(false);
    }
  };

  const stopRecording = () => {
    try {
      // Stop media recorder
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: "stop" }));
        wsRef.current.close();
        wsRef.current = null;
      }

      if (transcript.trim()) {
        const currentFull = textareaRef.current
          ? textareaRef.current.value
          : textRef.current ?? accumulatedTranscript ?? "";
        const before = currentFull.slice(0, cursorRef.current ?? 0);
        const after = currentFull.slice(cursorRef.current ?? 0);
        const newTranscript =
          before +
          (before && !before.endsWith(" ") ? " " : "") +
          transcript +
          (after && !after.startsWith(" ") ? " " : "") +
          after;
        setAccumulatedTranscript(newTranscript);
        textRef.current = newTranscript;
        setTranscript("");
      }

      setIsMicOn(false);
      setStatus("Ready");
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  const handleToggleRecording = () => {
    if (isMicOn) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="h-full">
      <style>{`
      textarea::-webkit-scrollbar {
        width: 6px;
      }
      textarea::-webkit-scrollbar-thumb {
        background-color: rgb(156 163 175);
        border-radius: 3px;
      }
      textarea::-webkit-scrollbar-track {
        background: transparent;
      }
    `}</style>

      {isMicSectionOpen ? (
        <Card
          className={`relative w-full h-full shadow-none pt-0 overflow-hidden flex flex-col ${
            !isMicSectionOpen ? "hover:bg-gray-100 " : ""
          }`}
        >
          <CardHeader
            className={`relative flex items-center border-b-4 rounded-xl pt-6 justify-center transition-colors flex-shrink-0 ${
              isMicOn && isMicConnected
                ? "border-green-600 bg-green-500"
                : "border-red-600 bg-red-400"
            }`}
          >
            <div>
              <div className="flex flex-col justify-center items-center">
                <div className="relative mb-2">
                  {isMicOn && isMicConnected && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-white/30 animate-[breathe_2s_ease-in-out_infinite]"></span>
                      <span className="absolute inset-0 rounded-full bg-white/30 animate-[breathe_2s_ease-in-out_infinite] [animation-delay:0.5s]"></span>
                    </>
                  )}
                  <Button
                    className={`${
                      isMicOn && isMicConnected
                        ? "bg-white/20 hover:bg-white/30 border-2 border-white/50"
                        : "bg-white/20 hover:bg-white/30 border-2 border-white/50"
                    } h-[50px] w-[50px] rounded-full relative z-10 transition-colors`}
                    onClick={handleToggleRecording}
                  >
                    <FontAwesomeIcon
                      className=" text-white"
                      icon={
                        isMicOn ? faMicrophoneLines : faMicrophoneLinesSlash
                      }
                    />
                  </Button>
                </div>
                <span className="text-white mb-4">{status}</span>
              </div>
            </div>
            <div className="absolute left-4 top-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-md font-semibold uppercase tracking-wide">
                <Mic className="h-4 w-4" />
                Stage 1
              </span>
            </div>
          </CardHeader>
          <CardContent className="relative px-4 py-1 flex flex-col items-center justify-center transition-all duration-300 flex-1 overflow-hidden">
            <Textarea
              placeholder={
                "No transcript yet. Click the microphone to start recording."
              }
              ref={textareaRef}
              className={
                "h-full px-2 sm:px-4 !text-base !sm:!text-lg !md:!text-lg !lg:!text-lg caret-black hover:caret-black whitespace-pre-wrap overflow-auto border border-gray-300 w-full rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#30c2a1] focus:border-[#30c2a1]"
              }
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgb(156 163 175) transparent",
              }}
              disabled={false}
              value={accumulatedTranscript}
              onChange={(e) => {
                cursorRef.current = e.target.selectionStart;
                setAccumulatedTranscript(e.target.value);
                textRef.current = e.target.value;
              }}
              onClick={() => {
                if (textareaRef.current) {
                  cursorRef.current = textareaRef.current.selectionStart;
                }
              }}
              onKeyUp={() => {
                if (textareaRef.current) {
                  cursorRef.current = textareaRef.current.selectionStart;
                }
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="h-full flex items-center justify-center overflow-hidden">
          <ArrowRightFromLine
            className="text-gray-500 text-[10px] "
            onClick={() => {
              if (!isMicSectionOpen) {
                setIsMicSectionOpen(true);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
