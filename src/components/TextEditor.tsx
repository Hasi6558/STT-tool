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

interface TextEditorProps {
  isModificationBarOpen: boolean;
  setIsModificationBarOpen: (value: boolean) => void;
  accumulatedTranscript: string;
  setAccumulatedTranscript: (value: string) => void;
}

export default function TextEditor({
  isModificationBarOpen,
  setIsModificationBarOpen,
  accumulatedTranscript,
  setAccumulatedTranscript,
}: TextEditorProps) {
  const [isMicOn, setIsMicOn] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [status, setStatus] = useState<string>("Ready");
  const [isMicConnected, setIsMicConnected] = useState<boolean>(false);

  const [cursorPosition, setCursorPosition] = useState<number>(0);

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
    // Check for microphone availability on component mount
    const checkMicrophoneAccess = async () => {
      try {
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

    checkMicrophoneAccess();

    // Listen for device changes
    const handleDeviceChange = () => {
      checkMicrophoneAccess();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      // Cleanup on unmount
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );

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

  const startRecording = async () => {
    try {
      setStatus("Initializing...");

      // Save cursor position before starting recording
      if (textareaRef.current) {
        setCursorPosition(textareaRef.current.selectionStart);
      }

      // Clear current session transcript items but keep accumulated transcript
      transcriptItemsRef.current.clear();
      currentItemIdRef.current = null;
      setTranscript("");

      // Request microphone access
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
              // Batch updates - only update transcript every few deltas to reduce re-renders
              setTranscript(rebuildTranscript());
            }
            break;

          case "conversation.item.input_audio_transcription.completed":
            // Final transcription for this segment
            if (data.transcript && data.item_id) {
              const item = transcriptItemsRef.current.get(data.item_id);
              if (item) {
                item.text = data.transcript;
                console.log(
                  `Completed transcription for ${data.item_id}: "${data.transcript}"`
                );
                setTranscript(rebuildTranscript());
              } else {
                // Fallback if item wasn't tracked
                console.log(
                  `Item ${data.item_id} not tracked, adding with transcript: "${data.transcript}"`
                );
                transcriptItemsRef.current.set(data.item_id, {
                  text: data.transcript,
                  previousItemId: null,
                });
                setTranscript(rebuildTranscript());
              }
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
        const before = accumulatedTranscript.slice(0, cursorPosition);
        const after = accumulatedTranscript.slice(cursorPosition);
        const newTranscript =
          before +
          (before && !before.endsWith(" ") ? " " : "") +
          transcript +
          (after && !after.startsWith(" ") ? " " : "") +
          after;
        setAccumulatedTranscript(newTranscript);
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
    <div>
      <Card className="w-full pt-0 ">
        <CardHeader
          className={`flex items-center border-b-4 rounded-xl pt-6 justify-center transition-colors ${
            isMicOn && isMicConnected
              ? "border-green-600 bg-green-500"
              : "border-red-600 bg-red-400"
          }`}
        >
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
                  icon={isMicOn ? faMicrophoneLines : faMicrophoneLinesSlash}
                />
              </Button>
            </div>
            <span className="text-white mb-4">{status}</span>
          </div>
        </CardHeader>
        <CardContent className="relative flex items-center justify-center">
          <div className="w-full">
            <div className="absolute top-0 right-0 flex items-start pt-2 sm:pt-4 hidden lg:flex">
              <Button
                className="h-12 w-6 sm:h-16 sm:w-8 rounded-l-lg rounded-r-none bg-zinc-200 hover:bg-zinc-300 shadow-md text-zinc-300 transition-all"
                onClick={() => setIsModificationBarOpen(!isModificationBarOpen)}
                title={isModificationBarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <FontAwesomeIcon
                  icon={isModificationBarOpen ? faChevronRight : faChevronLeft}
                  className="text-xs sm:text-sm text-black"
                />
              </Button>
            </div>

            <Textarea
              placeholder={
                "No transcript yet. Click the microphone to start recording."
              }
           
              ref={textareaRef}
              className={
                "h-[55vh] md:h-[45vh] lg:h-[55vh] px-2 sm:px-4 !text-base !sm:!text-lg !md:!text-lg !lg:!text-lg"
              }
              value={
                accumulatedTranscript && transcript
                  ? (() => {
                      const before = accumulatedTranscript.slice(
                        0,
                        cursorPosition
                      );
                      const after = accumulatedTranscript.slice(cursorPosition);
                      return (
                        before +
                        (before && !before.endsWith(" ") ? " " : "") +
                        transcript +
                        (after && !after.startsWith(" ") ? " " : "") +
                        after
                      );
                    })()
                  : accumulatedTranscript || transcript
              }
              onChange={(e) => {
                setAccumulatedTranscript(e.target.value);
                setCursorPosition(e.target.selectionStart);
              }}
              onClick={() => {
                if (textareaRef.current) {
                  setCursorPosition(textareaRef.current.selectionStart);
                }
              }}
              onKeyUp={() => {
                if (textareaRef.current) {
                  setCursorPosition(textareaRef.current.selectionStart);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
