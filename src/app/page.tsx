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

  return (
    <>
      <Navbar onPDFDownload={handleDownloadPDF} />
      <div className="flex items-center justify-center gap-4 py-0 px-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-center gap-6 border-b py-1 border-border bg-card/50">
          <button
            onClick={handleNavigateLeft}
            className="p-3 rounded-xl hover:bg-secondary text-foreground hover:text-primary transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Navigate left"
          >
            <ChevronLeft className="h-10 w-10 stroke-[3] hover:text-[#30c2a1] transition-all duration-200" />
          </button>

          <div className="flex items-center gap-3">
            {viewStates.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentViewIndex(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentViewIndex
                    ? "bg-[#30c2a1] w-8"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2.5"
                }`}
                aria-label={`Go to view ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNavigateRight}
            className="p-3 rounded-xl hover:bg-secondary text-foreground hover:text-primary transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Navigate right"
          >
            <ChevronRight className="h-10 w-10 stroke-[3] hover:text-[#30c2a1] transition-all duration-200" />
          </button>
        </div>
      </div>
      <div className="flex  bg-zinc-50 font-sans">
        <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-4rem)] p-2 sm:p-4 gap-2 sm:gap-4 lg:gap-8 mx-2 sm:mx-4 lg:mx-16 my-0">
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
          <div
            className={`transition-all duration-500 ease-out transform h-full ${
              showMic
                ? isMicSectionOpen
                  ? "flex-1 opacity-100 translate-x-0"
                  : "w-[46px] flex-none opacity-100 translate-x-0"
                : "w-0 opacity-0 -translate-x-full overflow-hidden"
            } ${showModificationOnMobile ? "hidden lg:block" : "block"}`}
          >
            {showMic && (
              <TextEditor
                isMicSectionOpen={isMicSectionOpen}
                setIsMicSectionOpen={setIsMicSectionOpen}
                accumulatedTranscript={accumulatedTranscript}
                setAccumulatedTranscript={setAccumulatedTranscript}
              />
            )}
          </div>
          {showMic && showPoints && (
            <div className="flex items-center justify-center flex-shrink-0 transition-opacity duration-300">
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
          <div
            className={`transition-all duration-500 ease-out transform h-full ${
              showPoints
                ? isPointSeparatorOpen
                  ? "flex-1 opacity-100 translate-x-0"
                  : "w-[46px] flex-none opacity-100 translate-x-0"
                : "w-0 opacity-0 translate-x-full overflow-hidden"
            }`}
          >
            {showPoints && (
              <PointSeparator
                isPointSeparatorOpen={isPointSeparatorOpen}
                setIsPointSeparatorOpen={setIsPointSeparatorOpen}
                accumulatedTranscript={accumulatedTranscript}
              />
            )}
          </div>

          {showPoints && showRefine && !isFullRefine && (
            <div className="flex items-center justify-center flex-shrink-0 transition-opacity duration-300">
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
          <div
            className={`transition-all duration-500 ease-out transform overflow-hidden h-full ${
              showRefine
                ? isRefinePannelOpen
                  ? "flex-1 opacity-100 translate-x-0"
                  : "w-[46px] flex-none opacity-100 translate-x-0"
                : "w-0 opacity-0 translate-x-full overflow-hidden"
            } ${
              showModificationOnMobile ? "block lg:hidden" : "hidden"
            } lg:block`}
          >
            {showRefine &&
              (showModificationOnMobile || isModificationBarOpen) && (
                <RefinePannel
                  accumulatedTranscript={accumulatedTranscript}
                  isRefinePannelOpen={isRefinePannelOpen}
                  setIsRefinePannelOpen={setIsRefinePannelOpen}
                />
              )}
          </div>
        </div>
      </div>
    </>
  );
}
