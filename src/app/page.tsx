"use client";
import TextEditor from "@/components/TextEditor";
import Modificationbar, {
  ModificationbarRef,
} from "@/components/Modificationbar";
import Navbar from "@/components/Navbar";
import { useRef, useState } from "react";
import PointSeparator from "@/components/PointSeperator";
import RefinePannel from "@/components/RefinePannel";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ViewState =
  | "mic-points" // half mic, half key points (default)
  | "full-points" // full key points
  | "full-mic" // full transcript/editor
  | "points-refine" // half key points, half refine
  | "full-refine";
const viewStates: ViewState[] = [
  "full-mic",
  "mic-points",
  "full-points",
  "points-refine",
  "full-refine",
];

export default function Home() {
  const modificationbarRef = useRef<ModificationbarRef>(null);
  const [isModificationBarOpen, setIsModificationBarOpen] = useState(true);
  const [isMicSectionOpen, setIsMicSectionOpen] = useState(true);
  const [isPointSeparatorOpen, setIsPointSeparatorOpen] = useState(true);
  const [isRefinePannelOpen, setIsRefinePannelOpen] = useState(true);
  const [currentViewIndex, setCurrentViewIndex] = useState(1);
  const currentView = viewStates[currentViewIndex];

  const [showModificationOnMobile, setShowModificationOnMobile] =
    useState(false);
  const [accumulatedTranscript, setAccumulatedTranscript] =
    useState<string>("");

  const handleDownloadPDF = () => {
    modificationbarRef.current?.exportToPDF();
  };
  const handleNavigateRight = () => {
    setCurrentViewIndex((prev) => (prev + 1) % viewStates.length);
  };
  const handleNavigateLeft = () => {
    setCurrentViewIndex(
      (prev) => (prev - 1 + viewStates.length) % viewStates.length
    );
  };
  const showMic = currentView === "mic-points" || currentView === "full-mic";
  const showPoints =
    currentView === "mic-points" ||
    currentView === "full-points" ||
    currentView === "points-refine";
  const showRefine =
    currentView === "points-refine" || currentView === "full-refine";
  const isFullPoints = currentView === "full-points";
  const isFullRefine = currentView === "full-refine";
  const isFullMic = currentView === "full-mic";
  const getViewLabel = () => {
    switch (currentView) {
      case "mic-points":
        return "Recording + Points";
      case "full-points":
        return "Key Points";
      case "full-mic":
        return "Recording";
      case "points-refine":
        return "Points + Refine";
      case "full-refine":
        return "Refine Argument";
    }
  };
  return (
    <>
      <Navbar onPDFDownload={handleDownloadPDF} />
      <div className="flex items-center justify-center gap-4 py-3 px-4 border-b border-border bg-card/50">
        <button
          onClick={handleNavigateLeft}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Navigate left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          {viewStates.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentViewIndex(index)}
              className={`w-2 h-2 rounded-full transition-all  ${
                index === currentViewIndex
                  ? "bg-[#30c2a1] w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to view ${index + 1}`}
            />
          ))}
        </div>

        <span className="text-sm text-muted-foreground min-w-[140px] text-center">
          {getViewLabel()}
        </span>

        <button
          onClick={handleNavigateRight}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Navigate right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="flex  bg-zinc-50 font-sans">
        <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-4rem)] p-2 sm:p-4 gap-2 sm:gap-4 lg:gap-8 mx-2 sm:mx-4 lg:mx-16 my-2 sm:my-4">
          {/* Mobile Toggle Button */}
          <div className="lg:hidden flex justify-center gap-2 mb-2">
            <button
              onClick={() => setShowModificationOnMobile(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                !showModificationOnMobile
                  ? "bg-[#30c2a1] text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Transcript
            </button>
            <button
              onClick={() => setShowModificationOnMobile(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                showModificationOnMobile
                  ? "bg-[#30c2a1] text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Transform
            </button>
          </div>

          {/* TextEditor - Hidden on mobile when showing modification bar */}
          {showMic && (
            <div
              className={`transition-all duration-300 h-full ${
                // when in full-mic view, allow the editor to take full available space
                isFullMic
                  ? "flex-1"
                  : isMicSectionOpen
                  ? "flex-1"
                  : "w-[46px] flex-none"
              } ${showModificationOnMobile ? "hidden lg:block" : "block"}`}
            >
              <TextEditor
                isMicSectionOpen={isMicSectionOpen}
                setIsMicSectionOpen={setIsMicSectionOpen}
                accumulatedTranscript={accumulatedTranscript}
                setAccumulatedTranscript={setAccumulatedTranscript}
              />
            </div>
          )}
          {showMic && showPoints && (
            <div className="flex items-center justify-center flex-shrink-0">
              <svg
                width="24"
                height="16"
                viewBox="0 0 40 24"
                fill="none"
                className="text-muted-foreground/30"
              >
                <path
                  d="M0 12H36M36 12L26 2M36 12L26 22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
          {showPoints && (
            <div
              className={`transition-all duration-300 h-full ${
                isPointSeparatorOpen ? "flex-1" : "w-[46px] flex-none"
              }`}
            >
              {/* point separator */}
              <PointSeparator
                isPointSeparatorOpen={isPointSeparatorOpen}
                setIsPointSeparatorOpen={setIsPointSeparatorOpen}
                accumulatedTranscript={accumulatedTranscript}
              />
            </div>
          )}
          {showPoints && showRefine && !isFullRefine && (
            <div className="flex items-center justify-center flex-shrink-0">
              <svg
                width="24"
                height="16"
                viewBox="0 0 40 24"
                fill="none"
                className="text-muted-foreground/30"
              >
                <path
                  d="M0 12H36M36 12L26 2M36 12L26 22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}

          {/* Modificationbar - Shows based on mobile toggle or desktop open state */}
          {showRefine && (
            <div
              className={`transition-all duration-300 overflow-hidden h-full ${
                showModificationOnMobile ? "block lg:hidden" : "hidden"
              } lg:block ${
                isRefinePannelOpen ? "lg:flex-1" : "lg:w-[46px] lg:flex-none"
              }`}
            >
              {(showModificationOnMobile || isModificationBarOpen) && (
                <RefinePannel
                  accumulatedTranscript={accumulatedTranscript}
                  isRefinePannelOpen={isRefinePannelOpen}
                  setIsRefinePannelOpen={setIsRefinePannelOpen}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
