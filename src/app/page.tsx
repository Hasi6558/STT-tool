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
import { pointsOutputRef } from "@/lib/persistentRefs";

export type ViewState =
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
  const [pointsOutput, setPointsOutput] = useState<string>(
    () => pointsOutputRef.current ?? "",
  );

  const handleDownloadPDF = () => {
    modificationbarRef.current?.exportToPDF();
  };
  const showMic = currentView === "mic-points" || currentView === "full-mic";
  const showPoints =
    currentView === "mic-points" ||
    currentView === "full-points" ||
    currentView === "points-refine";
  const showRefine =
    currentView === "points-refine" || currentView === "full-refine";

  return (
    <>
      <Navbar
        onPDFDownload={handleDownloadPDF}
        setCurrentViewIndex={setCurrentViewIndex}
        currentViewIndex={currentViewIndex}
      />
      <div className="flex bg-zinc-50 font-sans overflow-auto mt-2 bg-[#94a0a9]">
        <div className="flex flex-col lg:flex-row w-full  sm:p-0 gap-0 sm:gap-0 mx-0 my-0 bg-[#94a0a9]">
          {/* TextEditor - Hidden on mobile when showing modification bar */}
          <div
            className={`transition-all duration-500 ease-out transform ${
              showMic ?
                isMicSectionOpen ? "flex-1 opacity-100 translate-x-0"
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
          {/* {showMic && showPoints && (
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
          )} */}
          <div
            className={`transition-all duration-500 ease-out transform ${
              showPoints ?
                isPointSeparatorOpen ? "flex-1 opacity-100 translate-x-0"
                : "w-[46px] flex-none opacity-100 translate-x-0"
              : "w-0 opacity-0 translate-x-full overflow-hidden"
            }`}
          >
            {showPoints && (
              <PointSeparator
                isPointSeparatorOpen={isPointSeparatorOpen}
                setIsPointSeparatorOpen={setIsPointSeparatorOpen}
                accumulatedTranscript={accumulatedTranscript}
                setPointsOutput={setPointsOutput}
              />
            )}
          </div>

          {/* {showPoints && showRefine && !isFullRefine && (
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
          )} */}
          {/* Modificationbar - Shows based on mobile toggle or desktop open state */}
          <div
            className={`transition-all duration-500 ease-out transform overflow-hidden ${
              showRefine ?
                isRefinePannelOpen ? "flex-1 opacity-100 translate-x-0"
                : "w-[46px] flex-none opacity-100 translate-x-0"
              : "w-0 opacity-0 translate-x-full overflow-hidden"
            } ${
              showModificationOnMobile ? "block lg:hidden" : "hidden"
            } lg:block`}
          >
            {showRefine &&
              (showModificationOnMobile || isModificationBarOpen) && (
                <RefinePannel
                  accumulatedTranscript={pointsOutput}
                  isRefinePannelOpen={isRefinePannelOpen}
                  setIsRefinePannelOpen={setIsRefinePannelOpen}
                />
              )}
          </div>
        </div>
      </div>
      <div className="h-[200px]" />
    </>
  );
}
