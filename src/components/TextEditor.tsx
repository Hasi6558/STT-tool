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
import {
  ArrowRight,
  ArrowRightFromLine,
  ChevronDown,
  Mic,
  Text,
  Zap,
} from "lucide-react";
import { Arrow } from "@radix-ui/react-tooltip";
import ArrowButton from "./ArrowButton";

type TranscriptionMode = "nova" | "nova-3";

interface TextEditorProps {
  isMicSectionOpen: boolean;
  setIsMicSectionOpen: (value: boolean) => void;
  accumulatedTranscript: string;
  setAccumulatedTranscript: (value: string) => void;
  hideRightBorder?: boolean;
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
  const [transcriptionMode, setTranscriptionMode] =
    useState<TranscriptionMode>("nova");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>("");

  // State for inline interim display in realtime mode
  const [baseTextBefore, setBaseTextBefore] = useState<string>("");
  const [baseTextAfter, setBaseTextAfter] = useState<string>("");
  const [finalizedSessionText, setFinalizedSessionText] = useState<string>("");

  const cursorRef = useRef<number | null>(null);

  const textRef = useRef(accumulatedTranscript);

  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<{ stop: () => void; state: string } | null>(
    null,
  );
  const audioContextRef = useRef<AudioContext | null>(null);

  const transcriptionModeRef = useRef<TranscriptionMode>("nova");
  const finalizedTextRef = useRef<string>(""); // Track finalized text for realtime mode

  // Refs for tracking insertion point
  const insertionPointRef = useRef<number>(0);

  useEffect(() => {
    textRef.current = accumulatedTranscript;
  }, [accumulatedTranscript]);

  useEffect(() => {
    transcriptionModeRef.current = transcriptionMode;
  }, [transcriptionMode]);

  // Sync accumulated transcript when finalized text changes in realtime mode
  useEffect(() => {
    if (isMicOn && finalizedSessionText) {
      const completeText =
        baseTextBefore + finalizedSessionText + baseTextAfter;
      textRef.current = completeText;
      setAccumulatedTranscript(completeText);

      // Update cursor position
      const newCursorPos = baseTextBefore.length + finalizedSessionText.length;
      cursorRef.current = newCursorPos;

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = newCursorPos;
        }
      });
    }
  }, [
    finalizedSessionText,
    baseTextBefore,
    baseTextAfter,
    isMicOn,
    setAccumulatedTranscript,
  ]);

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
          (device) => device.kind === "audioinput",
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
          handleDeviceChange,
        );

        return () => {
          // Cleanup on unmount
          try {
            navigator.mediaDevices.removeEventListener(
              "devicechange",
              handleDeviceChange,
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

  // Function to update insertion point when cursor moves during realtime recording
  const updateRealtimeInsertionPoint = (newCursorPos: number) => {
    if (!isMicOn) return;

    // Build the current complete text from the current state
    const currentCompleteText =
      baseTextBefore + finalizedSessionText + baseTextAfter;

    // Clamp cursor position to valid range
    const clampedPos = Math.max(
      0,
      Math.min(newCursorPos, currentCompleteText.length),
    );

    // Re-split the text at the new cursor position
    setBaseTextBefore(currentCompleteText.slice(0, clampedPos));
    setBaseTextAfter(currentCompleteText.slice(clampedPos));
    setFinalizedSessionText("");

    // Update the ref
    textRef.current = currentCompleteText;
    setAccumulatedTranscript(currentCompleteText);

    // Update cursor ref
    cursorRef.current = clampedPos;
    insertionPointRef.current = clampedPos;

    // Clear any interim transcript since we're starting fresh at new position
    setInterimTranscript("");

    console.log(`[Realtime] Updated insertion point to ${clampedPos}`);
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

      // Clear current session transcript
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
        setStatus("Connecting to\ntranscription service...");

        // Initialize transcription session with selected mode
        ws.send(
          JSON.stringify({ type: "init", mode: transcriptionModeRef.current }),
        );

        // Reset finalized text tracker for realtime mode
        finalizedTextRef.current = "";
        // Store the base text split at cursor for inline interim display
        const currentText = textRef.current ?? "";
        const insertPos = cursorRef.current ?? currentText.length;
        insertionPointRef.current = insertPos;
        setBaseTextBefore(currentText.slice(0, insertPos));
        setBaseTextAfter(currentText.slice(insertPos));
        setFinalizedSessionText("");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received:", data);

        switch (data.type) {
          case "ready":
            setStatus("Recording...");
            break;

          case "error":
            console.error("WebSocket error:", data.message);
            setStatus(`Error: ${data.message}`);
            break;

          case "disconnected":
            setStatus("Disconnected");
            break;

          // ===== DEEPGRAM REALTIME MODE EVENTS =====
          case "deepgram_transcript":
            if (data.is_final && data.transcript) {
              // Final transcript - add to finalized session text
              console.log("[Deepgram] Final transcript:", data.transcript);

              // Use functional update to get latest state values
              setFinalizedSessionText((prevFinalized) => {
                const spacer = prevFinalized ? " " : "";
                const newFinalized = prevFinalized + spacer + data.transcript;

                // We need to update accumulated transcript in a separate effect
                // For now, store in ref for immediate access
                finalizedTextRef.current = newFinalized;

                return newFinalized;
              });

              // Clear interim display
              setInterimTranscript("");
              setStatus("Recording...");
            } else if (!data.is_final && data.transcript) {
              // Interim transcript - show inline at cursor position
              console.log("[Deepgram] Interim:", data.transcript);
              setInterimTranscript(data.transcript);
              setStatus("Listening...");
            }
            break;

          case "deepgram_speech_started":
            setStatus("Speech detected...");
            break;

          case "deepgram_utterance_end":
            setInterimTranscript(""); // Clear interim on utterance end
            setStatus("Recording...");
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
              Array.from(uint8Array.subarray(i, i + chunkSize)),
            );
          }
          const base64Audio = btoa(binary);

          // Send audio data to server
          ws.send(
            JSON.stringify({
              type: "audio",
              audio: base64Audio,
            }),
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
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
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

      // Clear interim transcript for realtime mode
      setInterimTranscript("");

      // Reset realtime mode state
      setBaseTextBefore("");
      setBaseTextAfter("");
      setFinalizedSessionText("");

      if (transcript.trim()) {
        const currentFull =
          textareaRef.current ?
            textareaRef.current.value
          : (textRef.current ?? accumulatedTranscript ?? "");
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
    <div className="flex flex-col">
      <style>{`
      textarea::-webkit-scrollbar {
        width: 8px;
      }
      textarea::-webkit-scrollbar-thumb {
        background-color: rgb(156 163 175);
        border-radius: 4px;
      }
      textarea::-webkit-scrollbar-thumb:hover {
        background-color: rgb(107 114 128);
      }
      textarea::-webkit-scrollbar-track {
        background: transparent;
      }
      
      /* Firefox */
      textarea {
        scrollbar-width: thin;
        scrollbar-color: rgb(156 163 175) transparent;
      }
    `}</style>

      <Card
        className={`relative w-full pt-0 flex flex-col h-full ${
          !isMicSectionOpen ? "hover:bg-gray-100 " : ""
        }`}
      >
        <CardHeader
          className={`relative flex items-center border-b-4 py-3 rounded-none pt-2 justify-center transition-colors flex-shrink-0 ${
            isMicOn && isMicConnected ?
              "border-green-600 bg-green-500"
            : "border-red-600 bg-red-400"
          }`}
        >
          <div className="flex w-full justify-between items-center">
            <div className="">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-md font-semibold uppercase tracking-wide ${
                  isMicOn && isMicConnected ?
                    "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
                }`}
              >
                Stage 1
              </span>
            </div>
            <div className="flex justify-center items-center">
              <div className="flex justify-center items-center gap-2">
                <div className="relative flex-shrink-0">
                  {isMicOn && isMicConnected && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-white/30 animate-[breathe_2s_ease-in-out_infinite]"></span>
                      <span className="absolute inset-0 rounded-full bg-white/30 animate-[breathe_2s_ease-in-out_infinite] [animation-delay:0.5s]"></span>
                    </>
                  )}
                  <Button
                    className={`${
                      isMicOn && isMicConnected ?
                        "bg-white/20 hover:bg-white/30 border-2 border-white/50"
                      : "bg-white/20 hover:bg-white/30 border-2 border-white/50"
                    } h-[30px] my-2 w-[50px] rounded-full relative z-10 transition-colors`}
                    onClick={handleToggleRecording}
                  >
                    <FontAwesomeIcon
                      className="text-white"
                      icon={
                        isMicOn ? faMicrophoneLines : faMicrophoneLinesSlash
                      }
                    />
                  </Button>
                </div>
                <span className="text-white whitespace-pre-line text-left min-w-[180px]">
                  {status}
                </span>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className=" right-4 top-4">
              <div className="relative">
                <button
                  onClick={() => !isMicOn && setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isMicOn}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isMicOn ?
                      "bg-white/20 text-white/60 cursor-not-allowed"
                    : "bg-white/30 hover:bg-white/40 text-white cursor-pointer"
                  }`}
                >
                  {transcriptionMode === "nova" ?
                    <>
                      <Zap className="h-4 w-4" />
                      Nova
                    </>
                  : <>
                      <Zap className="h-4 w-4" />
                      Nova 3
                    </>
                  }
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isDropdownOpen && !isMicOn && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded border border-gray-300 overflow-hidden z-50">
                    <button
                      onClick={() => {
                        setTranscriptionMode("nova");
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors ${
                        transcriptionMode === "nova" ?
                          "bg-green-50 text-green-700"
                        : "text-gray-700"
                      }`}
                    >
                      <Zap className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Nova</div>
                        <div className="text-xs text-gray-500">
                          Deepgram Baseline
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setTranscriptionMode("nova-3");
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors ${
                        transcriptionMode === "nova-3" ?
                          "bg-green-50 text-green-700"
                        : "text-gray-700"
                      }`}
                    >
                      <Zap className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Nova 3</div>
                        <div className="text-xs text-gray-500">
                          Deepgram Enhanced
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative px-8 pt-0 pb-0 flex flex-col items-center justify-start transition-all duration-300">
          <Textarea
            placeholder={
              transcriptionMode === "nova" ?
                "No transcript yet. Click the microphone to start recording.\n(Deepgram Nova - Baseline Model)"
              : "No transcript yet. Click the microphone to start recording.\n(Deepgram Nova 3 - Enhanced Model)"
            }
            ref={textareaRef}
            className={
              "w-full h-[calc(100vh-8rem)] mx-[20px] rounded-none !outline-none px-2 sm:px-4 !text-base !sm:!text-lg !md:!text-lg !lg:!text-lg caret-black hover:caret-black resize-y !field-sizing-normal border-0 focus-visible:ring-0 bg-white overflow-y-auto custom-scrollbar"
            }
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgb(156 163 175) transparent",
              boxShadow:
                "-6px 0 10px rgba(0,0,0,0.15), 6px 0 10px rgba(0,0,0,0.15)",
            }}
            disabled={false}
            value={
              // For realtime mode during recording, show interim text inline at cursor position
              isMicOn && interimTranscript ?
                baseTextBefore +
                finalizedSessionText +
                (finalizedSessionText ? " " : "") +
                interimTranscript +
                baseTextAfter
              : accumulatedTranscript
            }
            onChange={(e) => {
              const newPos = e.target.selectionStart;
              cursorRef.current = newPos;

              // If in recording mode, we need to handle the change specially
              if (isMicOn) {
                // Update the accumulated transcript and re-establish insertion point
                const newValue = e.target.value;
                textRef.current = newValue;
                setAccumulatedTranscript(newValue);

                // Re-split at cursor position
                setBaseTextBefore(newValue.slice(0, newPos));
                setBaseTextAfter(newValue.slice(newPos));
                setFinalizedSessionText("");
                setInterimTranscript("");
              } else {
                setAccumulatedTranscript(e.target.value);
                textRef.current = e.target.value;
              }
            }}
            onClick={() => {
              if (textareaRef.current) {
                const newPos = textareaRef.current.selectionStart;
                cursorRef.current = newPos;

                // Update insertion point if in recording mode
                if (isMicOn) {
                  // Use setTimeout to ensure we get the position after the click is processed
                  setTimeout(() => {
                    if (textareaRef.current) {
                      updateRealtimeInsertionPoint(
                        textareaRef.current.selectionStart,
                      );
                    }
                  }, 0);
                }
              }
            }}
            onKeyUp={(e) => {
              if (textareaRef.current) {
                const newPos = textareaRef.current.selectionStart;
                cursorRef.current = newPos;

                // Update insertion point if in realtime recording mode and navigation key pressed
                const navigationKeys = [
                  "Enter",
                  "ArrowUp",
                  "ArrowDown",
                  "ArrowLeft",
                  "ArrowRight",
                  "Home",
                  "End",
                  "PageUp",
                  "PageDown",
                ];
                if (isMicOn && navigationKeys.includes(e.key)) {
                  updateRealtimeInsertionPoint(newPos);
                }
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
