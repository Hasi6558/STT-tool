"use client";
import TextEditor from "@/components/TextEditor";
import Modificationbar, {
  ModificationbarRef,
} from "@/components/Modificationbar";
import Navbar from "@/components/Navbar";
import { useRef, useState } from "react";
import PointSeparator from "@/components/PointSeperator";
import RefinePannel from "@/components/RefinePannel";

export default function Home() {
  const modificationbarRef = useRef<ModificationbarRef>(null);
  const [isModificationBarOpen, setIsModificationBarOpen] = useState(true);
  const [isMicSectionOpen, setIsMicSectionOpen] = useState(true);
  const [isPointSeparatorOpen, setIsPointSeparatorOpen] = useState(true);
  const [isRefinePannelOpen, setIsRefinePannelOpen] = useState(false);

  const [showModificationOnMobile, setShowModificationOnMobile] =
    useState(false);
  const [accumulatedTranscript, setAccumulatedTranscript] =
    useState<string>("");

  const handleDownloadPDF = () => {
    modificationbarRef.current?.exportToPDF();
  };

  return (
    <>
      <Navbar onPDFDownload={handleDownloadPDF} />
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
          <div
            className={`transition-all duration-300 h-full ${
              isMicSectionOpen ? "flex-1" : "w-[46px] flex-none"
            } ${showModificationOnMobile ? "hidden lg:block" : "block"}`}
          >
            <TextEditor
              isMicSectionOpen={isMicSectionOpen}
              setIsMicSectionOpen={setIsMicSectionOpen}
              accumulatedTranscript={accumulatedTranscript}
              setAccumulatedTranscript={setAccumulatedTranscript}
            />
          </div>
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

          {/* Modificationbar - Shows based on mobile toggle or desktop open state */}
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
        </div>
      </div>
    </>
  );
}
