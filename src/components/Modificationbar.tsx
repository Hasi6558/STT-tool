import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ModificationbarProps {
  accumulatedTranscript: string;
}
type ModificationPromptResponse = {
  result: string;
};
async function transform(type: "clean" | "enhance" | "book", text: string): Promise<ModificationPromptResponse | undefined> {
  try {
    const res = await fetch("/api/transform", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: type,
        text: text,
      }),
    });
    const data: ModificationPromptResponse = await res.json();
    return data;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

export default function Modificationbar({
  accumulatedTranscript,
}: ModificationbarProps) {
  const [modifiedtext, setModifiedtext] =
    useState<ModificationPromptResponse>({result: ""});

  const handleCleanUpBtnClick = async (text: string) => {
    const result: ModificationPromptResponse | undefined = await transform("clean", text);
    if (result) {
        setModifiedtext(result);
    }

  };
  const handleBookBtnClick = async (text: string) => {
    const result = await transform("book", text);
      if (result) {
          setModifiedtext(result);
      }
  };
  const handleEnhanceBtnClick = async (text: string) => {
    const result = await transform("enhance", text);
      if (result) {
          setModifiedtext(result);
      }
  };

  return (
    <div className="">
      <Card className="min-h-screen">
        <CardHeader className="flex items-center border-b-1 border-b-gray-300 justify-center pb-4  ">
          <Button
            onClick={() => handleCleanUpBtnClick(accumulatedTranscript)}
            disabled={!accumulatedTranscript}
          >
            Clean Up
          </Button>
          <Button
            onClick={() => handleEnhanceBtnClick(accumulatedTranscript)}
            disabled={!accumulatedTranscript}
          >
            Enhance
          </Button>
          <Button
            onClick={() => handleBookBtnClick(accumulatedTranscript)}
            disabled={!accumulatedTranscript}
          >
            Boook Style
          </Button>
        </CardHeader>
        <CardContent className="flex items-center border-b-1 border-b-gray-300 justify-center pb-4  ">
          <div className="bg-[#f3f4f6] w-full h-[75vh]">{modifiedtext.result}</div>
        </CardContent>
      </Card>
    </div>
  );
}
