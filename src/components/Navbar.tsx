"use client";

import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ViewState } from "@/app/page";

interface NavbarProps {
  onPDFDownload: () => void;
  setCurrentViewIndex: React.Dispatch<React.SetStateAction<number>>;
  currentViewIndex: number;
}
const viewStates: ViewState[] = [
  "full-mic",
  "mic-points",
  "full-points",
  "points-refine",
  "full-refine",
];
export default function Navbar({
  onPDFDownload,
  setCurrentViewIndex,
  currentViewIndex,
}: NavbarProps) {
  const handleNavigateRight = () => {
    setCurrentViewIndex((prev) => (prev + 1) % viewStates.length);
  };
  const handleNavigateLeft = () => {
    setCurrentViewIndex(
      (prev) => (prev - 1 + viewStates.length) % viewStates.length,
    );
  };
  return (
    <nav className="w-full bg-white pt-1">
      <div className="grid grid-cols-3 items-center my-1 mx-2 sm:mx-4 md:mx-6 lg:px-16">
        <div className="flex items-center justify-start">
          <FontAwesomeIcon
            icon={faMicrophone}
            className="bg-[#30c2a1] text-white p-1.5 sm:p-2 border rounded-lg mr-1 sm:mr-2"
          />
          <span className="font-bold text-xs sm:text-sm md:text-xl">
            Speech to Text Writing Tool
          </span>
        </div>
        <div className="flex items-center justify-center gap-6 bg-card/50">
          <button
            onClick={handleNavigateLeft}
            className="p-0 rounded-xl hover:bg-secondary text-foreground hover:text-primary transition-all duration-200 hover:scale-110 active:scale-95"
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
                  index === currentViewIndex ? "bg-[#30c2a1] w-8" : (
                    "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2.5"
                  )
                }`}
                aria-label={`Go to view ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNavigateRight}
            className="p-0 rounded-xl hover:bg-secondary text-foreground hover:text-primary transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Navigate right"
          >
            <ChevronRight className="h-10 w-10 stroke-[3] hover:text-[#30c2a1] transition-all duration-200" />
          </button>
        </div>
        <div className="flex justify-end">
          <Button
            className="bg-[#30c2a1] hover:bg-[#28a88c] text-xs sm:text-sm px-2 sm:px-4"
            onClick={onPDFDownload}
          >
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
