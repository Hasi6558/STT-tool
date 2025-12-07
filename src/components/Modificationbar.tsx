import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { forwardRef, useState, useImperativeHandle } from "react";
import { Spinner } from "@/components/ui/spinner";
import { jsPDF } from "jspdf";

interface ModificationbarProps {
  accumulatedTranscript: string;
}
type ModificationPromptResponse = {
  result: string;
};
export interface ModificationbarRef {
  exportToPDF: () => void;
}
async function transform(
  type: "clean" | "enhance" | "book",
  text: string,
  setLoading: (value: boolean) => void,
  setModifiedText: (value: ModificationPromptResponse) => void
): Promise<void> {
  try {
    setLoading(true);
    const res = await fetch("/api/transform", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: type,
        text: text,
      }),
    });
    const data: ModificationPromptResponse = await res.json();
    setModifiedText(data);
  } catch (error) {
    console.log(error);
    return undefined;
  } finally {
    setLoading(false);
  }
}

const Modificationbar = forwardRef<ModificationbarRef, ModificationbarProps>(
  ({ accumulatedTranscript }, ref) => {
    const [modifiedText, setModifiedText] =
      useState<ModificationPromptResponse>({
        result: "",
      });
    const [selectedBtn, setSelectedBtn] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    useImperativeHandle(ref, () => ({
      exportToPDF: () => {
        const text = modifiedText.result || "No content available";
        const title = "Transformed Text";
        const date = new Date().toLocaleDateString();
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(title, 15, 15);

        doc.setFontSize(12);
        doc.setTextColor(120, 120, 120);
        doc.text(`Date: ${date}`, 15, 25);
        doc.setTextColor(0, 0, 0);

        doc.setFontSize(12);

        const lineHeight = 7;
        let y = 35;
        const maxWidth = 180;

        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 15, y);
          y += lineHeight;
        });
        doc.save(`transformed_text_${Date.now().toString()}`);
      },
    }));

    const handleCleanUpBtnClick = async (text: string) => {
      await transform("clean", text, setLoading, setModifiedText);
    };
    const handleBookBtnClick = async (text: string) => {
      await transform("book", text, setLoading, setModifiedText);
    };
    const handleEnhanceBtnClick = async (text: string) => {
      await transform("enhance", text, setLoading, setModifiedText);
    };

    return (
      <div className="">
        <Card className="min-h-screen">
          <CardHeader className="flex flex-wrap items-center border-b border-gray-300 justify-start pb-2 sm:pb-4 gap-2 sm:gap-3">
            <div
              className={`p-1 border-[3px] rounded-xl transition-all ${
                selectedBtn === "clean"
                  ? "border-[#30c2a1]"
                  : "border-transparent"
              } ${!accumulatedTranscript ? "opacity-50" : ""}`}
            >
              <Button
                onClick={() => {
                  handleCleanUpBtnClick(accumulatedTranscript);
                  setSelectedBtn("clean");
                }}
                disabled={!accumulatedTranscript}
                className="bg-[#30c2a1] hover:bg-[#28a88c] text-xs sm:text-sm md:text-md h-9 sm:h-10 md:h-11 min-w-[90px] sm:min-w-[100px] md:min-w-[110px] px-3 sm:px-4 md:px-6"
              >
                Clean Up
              </Button>
            </div>
            <div
              className={`p-1 border-[3px] rounded-xl transition-all ${
                selectedBtn === "enhance"
                  ? "border-[#30c2a1]"
                  : "border-transparent"
              } ${!accumulatedTranscript ? "opacity-50" : ""}`}
            >
              <Button
                onClick={() => {
                  handleEnhanceBtnClick(accumulatedTranscript);
                  setSelectedBtn("enhance");
                }}
                disabled={!accumulatedTranscript}
                className="bg-[#30c2a1] hover:bg-[#28a88c] text-xs sm:text-sm md:text-md h-9 sm:h-10 md:h-11 min-w-[90px] sm:min-w-[100px] md:min-w-[110px] px-3 sm:px-4 md:px-6"
              >
                Enhance
              </Button>
            </div>

            <div
              className={`p-1 border-[3px] rounded-xl transition-all ${
                selectedBtn === "book"
                  ? "border-[#30c2a1]"
                  : "border-transparent"
              } ${!accumulatedTranscript ? "opacity-50" : ""}`}
            >
              <Button
                onClick={() => {
                  handleBookBtnClick(accumulatedTranscript);
                  setSelectedBtn("book");
                }}
                disabled={!accumulatedTranscript}
                className="bg-[#30c2a1] hover:bg-[#28a88c] text-xs sm:text-sm md:text-md h-9 sm:h-10 md:h-11 min-w-[90px] sm:min-w-[100px] md:min-w-[110px] px-3 sm:px-4 md:px-6"
              >
                Book Style
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex items-center border-gray-300 justify-center pb-2 sm:pb-4">
            <div className="bg-[#f3f4f6] w-full h-[60vh] sm:h-[65vh] lg:h-[75vh] p-2 sm:p-4 md:p-6 rounded-md overflow-auto whitespace-pre-wrap text-sm sm:text-base">
              {loading ? <Spinner /> : <span>{modifiedText.result}</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);
Modificationbar.displayName = "Modificationbar";
export default Modificationbar;
