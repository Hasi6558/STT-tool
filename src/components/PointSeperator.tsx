import { ArrowUpFromLine, List, Mic, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import ArrowButton from "./ArrowButton";
import { Spinner } from "./ui/spinner";
import { pointsRef } from "@/lib/persistentRefs";

interface Point {
  heading: string;
  text: string;
}

interface PointSeparatorProps {
  isPointSeparatorOpen: boolean;
  accumulatedTranscript: string;
  setIsPointSeparatorOpen: (open: boolean) => void;
}

const PointSeparator = ({
  isPointSeparatorOpen,
  setIsPointSeparatorOpen,
  accumulatedTranscript,
}: PointSeparatorProps) => {
  // lazy-init from shared ref so data survives unmount
  const [points, setPoints] = useState<Point[]>(() => pointsRef.current ?? []);
  const [loading, setLoading] = useState<boolean>(false);

  async function handleExtractPoint(): Promise<void> {
    try {
      if (loading) return;
      setLoading(true);
      const response = await fetch("/api/extract-points", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: accumulatedTranscript }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data: { result: string } = await response.json();
      const resultText = data.result;
      const parsed = JSON.parse(resultText);
      setPoints(parsed);
      pointsRef.current = parsed;
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error extracting points:", error);
    }
  }

  return (
    <div className="w-full h-full">
      <style>{`
      /* WebKit-based browsers */
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgb(156 163 175);
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }

      /* Firefox */
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgb(156 163 175) transparent;
      }

      /* Keep textarea-targeted rules for compatibility */
      textarea::-webkit-scrollbar { width: 6px; }
      textarea::-webkit-scrollbar-thumb { background-color: rgb(156 163 175); border-radius: 3px; }
      textarea::-webkit-scrollbar-track { background: transparent; }
    `}</style>
      {isPointSeparatorOpen ? (
        <Card
          className={`relative h-full overflow-hidden flex flex-col gap-0 ${
            !isPointSeparatorOpen ? "hover:bg-gray-100 " : ""
          }`}
        >
          <CardHeader className="border-b-1 pb-3 relative flex-shrink-0">
            <div className="w-full flex justify-between w-full">
              <div className="flex justify-start items-center gap-2">
                <div className="flex items-center gap-2 text-2xl">
                  <List size={20} color="#30c2a1" />
                  <h2 className="font-bold mr-2">Key Points</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-md font-semibold uppercase tracking-wide">
                  Stage 2
                </span>
              </div>

              <Button
                onClick={() => handleExtractPoint()}
                disabled={loading || !accumulatedTranscript}
                className="bg-[#30c2a1] hover:bg-[#28a88c] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-[16px] h-9 sm:h-10 md:h-10 px-3 sm:px-4 md:px-6 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  {loading ? <Spinner /> : <Sparkles />}
                  <span>{loading ? "Extracting..." : "Extract Points"}</span>
                </div>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0 p-4 custom-scrollbar">
            <Card className="p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner />
                </div>
              ) : (
                <div className="h-full">
                  <div className="whitespace-pre-wrap">
                    {points.map((point, index) => (
                      <div key={index} className="mb-6">
                        <h3 className="font-semibold text-lg mb-2">
                          {point.heading}
                        </h3>
                        <p className="whitespace-pre-wrap">{point.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </CardContent>
        </Card>
      ) : (
        <div className="group h-full flex flex-col justify-center items-center overflow-hidden">
          <ArrowUpFromLine
            className="text-gray-500 text-[10px] cursor-pointer"
            onClick={() => {
              if (!isPointSeparatorOpen) {
                setIsPointSeparatorOpen(true);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PointSeparator;
