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
      {isRefinePannelOpen ? (
        <Card
          className={`h-full ${
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
              <div className="flex items-center gap-2 mb-3 ">
                <Sparkles className="text-[#30c2a1]" size={20} />
                <h2 className="font-bold">Refine Argument</h2>
              </div>

              <div>
                <Textarea
                  placeholder="e.g., Technology is the best place to create change because it is both effective and efficient"
                  className="resize-none h-15"
                  onChange={(e) => handleTextChange(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1 mt-2 py-1">
                <div
                  className={`flex justify-center items-center p-0.5 border-[3px] rounded-2xl transition-all ${
                    selectedBtn === "clean"
                      ? "border-[#30c2a1]"
                      : "border-transparent"
                  } ${!accumulatedTranscript ? "opacity-50" : ""}`}
                >
                  <Button
                    onClick={() => {
                      setSelectedBtn("clean");
                    }}
                    disabled={!accumulatedTranscript || loading}
                    className="bg-[#30c2a1] hover:bg-[#28a88c] text-xs sm:text-sm md:text-[16px] h-9 sm:h-10 md:h-10 min-w-[90px] sm:min-w-[100px] md:min-w-[110px] px-3 sm:px-4 md:px-6 rounded-[12px]"
                  >
                    <BrushCleaning />
                    Clean Up
                  </Button>
                </div>
                <div
                  className={`flex justify-center items-center p-0.5 border-[3px] rounded-2xl transition-all ${
                    selectedBtn === "enhance"
                      ? "border-[#30c2a1]"
                      : "border-transparent"
                  } ${!accumulatedTranscript ? "opacity-50" : ""}`}
                >
                  <Button
                    onClick={() => {
                      setSelectedBtn("enhance");
                    }}
                    disabled={!accumulatedTranscript || loading}
                    className="bg-[#30c2a1] hover:bg-[#28a88c] text-xs sm:text-sm md:text-[16px] h-9 sm:h-10 md:h-10 min-w-[90px] sm:min-w-[100px] md:min-w-[110px] px-3 sm:px-4 md:px-6 rounded-[12px]"
                  >
                    <ArrowUpNarrowWide />
                    Enhance
                  </Button>
                </div>
                <div
                  className={`flex justify-center items-center p-0.5 border-[3px] rounded-2xl transition-all ${
                    selectedBtn === "book"
                      ? "border-[#30c2a1]"
                      : "border-transparent"
                  } ${!accumulatedTranscript ? "opacity-50" : ""}`}
                >
                  <Button
                    onClick={() => {
                      setSelectedBtn("book");
                    }}
                    disabled={!accumulatedTranscript || loading}
                    className="bg-[#30c2a1] hover:bg-[#28a88c] text-xs sm:text-sm md:text-[16px] h-9 sm:h-10 md:h-10 min-w-[90px] sm:min-w-[100px] md:min-w-[110px] px-3 sm:px-4 md:px-6 rounded-[12px]"
                  >
                    <BookOpenText />
                    Book Style
                  </Button>
                </div>
                <div>
                  <Button
                    className="mt-0 w-full bg-[#30c2a1] hover:bg-[#28a88c] text-sm sm:text-md md:text-[16px] h-9 sm:h-11 md:h-11 px-3 sm:px-4 md:px-6 rounded-[12px] font-medium"
                    onClick={() => {
                      handleFinalText();
                    }}
                    disabled={loading || !accumulatedTranscript}
                  >
                    {loading ? <Spinner /> : <Send />}
                    Generate Final Text
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0 p-4 border-gray-300">
            <Card
              className="w-full pt-0 pb-8 px-1  shadow-none overflow-auto !rounded-none border-none"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgb(156 163 175) transparent",
                maxHeight: "100%",
              }}
            >
              <div className="whitespace-pre-wrap">{finalText}</div>
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
