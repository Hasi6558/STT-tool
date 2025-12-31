import {
  ArrowLeftFromLine,
  ArrowUpNarrowWide,
  BookOpen,
  BookOpenText,
  BrushCleaning,
  Mic,
  Send,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { JSX, useCallback, useState, useEffect } from "react";
import {
  refineFinalTextRef,
  refineCoreArgumentRef,
} from "@/lib/persistentRefs";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";

interface RefinePannelProps {
  accumulatedTranscript: string;
  isRefinePannelOpen: boolean;
  setIsRefinePannelOpen: (open: boolean) => void;
}

const RefinePannel = ({
  accumulatedTranscript,
  isRefinePannelOpen,
  setIsRefinePannelOpen,
}: RefinePannelProps): JSX.Element => {
  const [selectedBtn, setSelectedBtn] = useState<string>("clean");
  const [coreArgument, setCoreArgument] = useState<string>(
    () => refineCoreArgumentRef.current ?? ""
  );
  const [finalText, setFinalText] = useState<string>(
    () => refineFinalTextRef.current ?? ""
  );
  const [loading, setLoading] = useState<boolean>(false);

  const handleTextChange = useCallback((text: string): void => {
    setCoreArgument(text);
    refineCoreArgumentRef.current = text;
  }, []);
  const handleFinalText = useCallback(async (): Promise<void> => {
    try {
      if (loading) return;
      setLoading(true);
      const response = await fetch("/api/transform", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: accumulatedTranscript,
          type: selectedBtn,
          coreArgument: coreArgument,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data: { result: string } = await response.json();
      const resultText = data.result;
      setFinalText(resultText);
      refineFinalTextRef.current = resultText;
      console.log("Final Text:", resultText);
    } catch (error) {
      console.error("Error generating final text:", error);
    } finally {
      setLoading(false);
    }
  }, [coreArgument, selectedBtn, accumulatedTranscript, loading]);

  return (
    <div className="h-full">
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
      {isRefinePannelOpen ? (
        <Card
          className={`h-full gap-0 ${
            !isRefinePannelOpen ? "hover:bg-gray-100 " : ""
          }`}
          onClick={() => {
            if (!isRefinePannelOpen) {
              setIsRefinePannelOpen(true);
            }
          }}
        >
          <CardHeader className="relative border-b-1 ">
            <div>
              <div className="flex justify-start items-center mb-0 gap-2">
                <div className="flex items-center gap-2 text-2xl   ">
                  <Sparkles className="text-[#30c2a1]" size={20} />
                  <h2 className="font-bold  mr-2">Refine Argument</h2>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-md font-semibold uppercase tracking-wide">
                  Stage 3
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <Textarea
                    className="resize-none h-15 w-full"
                    placeholder="e.g., Technology is the best place to create change because it is both effective and efficient"
                    onChange={(e) => handleTextChange(e.target.value)}
                  />
                </div>

                <div className="flex flex-col items-start w-[160px] gap-1 ml-3 mr-2 py-1">
                  <div className="flex flex-row gap-1">
                    <Button
                      onClick={() => setSelectedBtn("clean")}
                      disabled={!accumulatedTranscript || loading}
                      className={`text-xs sm:text-sm md:text-[14px] h-8 sm:h-9 md:h-9 w-[50px] px-2 sm:px-3 md:px-4 rounded-[8px] transition-all ${
                        selectedBtn === "clean"
                          ? "bg-[#30c2a1] hover:bg-[#28a88c] border-2 border-[#30c2a1]"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700 border-2 border-transparent"
                      }`}
                    >
                      <BrushCleaning className="mr-1" />
                    </Button>
                    <Button
                      onClick={() => setSelectedBtn("book")}
                      disabled={!accumulatedTranscript || loading}
                      className={`text-xs sm:text-sm md:text-[14px] h-8 sm:h-9 md:h-9 w-[50px] px-2 sm:px-3 md:px-4 rounded-[8px] transition-all ${
                        selectedBtn === "book"
                          ? "bg-[#30c2a1] hover:bg-[#28a88c] border-2 border-[#30c2a1]"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700 border-2 border-transparent"
                      }`}
                    >
                      <BookOpenText className="mr-1" />
                    </Button>
                    <Button
                      onClick={() => setSelectedBtn("enhance")}
                      disabled={!accumulatedTranscript || loading}
                      className={`text-xs sm:text-sm md:text-[14px] h-8 sm:h-9 md:h-9 w-[50px] px-2 sm:px-3 md:px-4 rounded-[8px] transition-all ${
                        selectedBtn === "enhance"
                          ? "bg-[#30c2a1] hover:bg-[#28a88c] border-2 border-[#30c2a1]"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700 border-2 border-transparent"
                      }`}
                    >
                      <ArrowUpNarrowWide className="mr-1" />
                    </Button>
                  </div>

                  <div className="flex gap-1 w-full">
                    <Button
                      className="mt-0 w-[160px] bg-[#7039ee] hover:bg-[#5706b3] text-sm sm:text-md md:text-[16px] h-9 sm:h-11 md:h-9  sm:px-4 md:px-6 rounded-[12px] font-medium"
                      onClick={() => {
                        handleFinalText();
                      }}
                      disabled={loading || !accumulatedTranscript}
                    >
                      {loading ? <Spinner /> : <Send />}
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0 p-4 custom-scrollbar border-gray-300">
            <Card className="w-full min-h-full p-4 shadow-none rounded-lg border-2">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner />
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{finalText}</div>
              )}
            </Card>
          </CardContent>
        </Card>
      ) : (
        <div className="group h-full flex flex-col justify-center items-center overflow-hidden">
          <ArrowLeftFromLine
            className="text-gray-500 text-[10px] "
            onClick={() => {
              if (!isRefinePannelOpen) {
                setIsRefinePannelOpen(true);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
export default RefinePannel;
