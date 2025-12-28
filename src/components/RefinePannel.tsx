import { Mic, Send, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { JSX, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faChevronUp } from "@fortawesome/free-solid-svg-icons";

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
  return (
    <div className="h-full">
      <Card
        className={`h-full ${!isRefinePannelOpen ? "hover:bg-gray-100 " : ""}`}
        onClick={() => {
          if (!isRefinePannelOpen) {
            setIsRefinePannelOpen(true);
          }
        }}
      >
        {isRefinePannelOpen ? (
          <>
            <CardHeader className="relative border-b-1 pb-2">
              <div>
                <div className="flex items-center gap-2 mb-3 ">
                  <Sparkles className="text-[#30c2a1]" size={20} />
                  <h2 className="font-bold">Refine Argument</h2>
                </div>
                <div className="mb-2">
                  <p className="text-[15px] text-gray-500">
                    {"What's the core argument you want to make?"}
                  </p>
                </div>
                <div>
                  <Textarea
                    placeholder="e.g., Technology is the best place to create change because it is both effective and efficient"
                    className="resize-none h-15"
                  />
                </div>
                <div className="flex gap-1 my-2">
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
                      disabled={!accumulatedTranscript}
                      className="bg-[#30c2a1] hover:bg-[#28a88c] text-xs sm:text-sm md:text-[16px] h-9 sm:h-10 md:h-10 min-w-[90px] sm:min-w-[100px] md:min-w-[110px] px-3 sm:px-4 md:px-6 rounded-[12px]"
                    >
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
                      disabled={!accumulatedTranscript}
                      className="bg-[#30c2a1] hover:bg-[#28a88c] text-xs sm:text-sm md:text-[16px] h-9 sm:h-10 md:h-10 min-w-[90px] sm:min-w-[100px] md:min-w-[110px] px-3 sm:px-4 md:px-6 rounded-[12px]"
                    >
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
                      disabled={!accumulatedTranscript}
                      className="bg-[#30c2a1] hover:bg-[#28a88c] text-xs sm:text-sm md:text-[16px] h-9 sm:h-10 md:h-10 min-w-[90px] sm:min-w-[100px] md:min-w-[110px] px-3 sm:px-4 md:px-6 rounded-[12px]"
                    >
                      Book Style
                    </Button>
                  </div>
                </div>
                <div>
                  <Button className="mt-0 w-full bg-[#30c2a1] hover:bg-[#28a88c] text-sm sm:text-md md:text-[16px] h-9 sm:h-11 md:h-11 px-3 sm:px-4 md:px-6 rounded-[12px] font-medium">
                    <Send />
                    Generate Final Test
                  </Button>
                </div>
              </div>
              {isRefinePannelOpen && (
                <div className="absolute top-[-25px] right-0 transform -translate-x-1/2 flex justify-center items-start pt-2 sm:pt-4 hidden lg:flex">
                  <Button
                    className="h-8 w-8 sm:h-8 sm:w-8 bg-zinc-100 hover:bg-zinc-300 shadow-md text-zinc-300 opacity-100 hover:opacity-100 transition-all"
                    onClick={() => setIsRefinePannelOpen(!isRefinePannelOpen)}
                    title={"Close sidebar"}
                  >
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="text-xs sm:text-sm text-black"
                    />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex items-center border-gray-300 justify-center pb-2 sm:pb-4">
              <Card
                className="w-full h-56 sm:h-60 md:h-72 lg:h-[30vh] border-none shadow-none overflow-auto"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgb(156 163 175) transparent",
                }}
              >
                <div>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Corrupti sit voluptate nemo aliquam fugit omnis architecto
                  molestiae impedit nisi rerum aperiam, tempora asperiores
                  praesentium alias dolores soluta necessitatibus deserunt
                  consectetur? Facere quas omnis dolore. Magni, quos atque
                  impedit quo excepturi, ducimus eaque unde magnam a inventore
                  neque veniam totam, facilis eius! Quibusdam aut debitis optio,
                  aliquam sint eos quasi molestiae! Maiores a ratione incidunt
                  odio ipsum quibusdam ducimus similique
                </div>
              </Card>
            </CardContent>
          </>
        ) : (
          <div className="group h-full flex flex-col justify-center items-center overflow-hidden">
            <CardContent className="transition-all duration-300 h-full overflow-hidden">
              <div className="h-[78vh] flex flex-col items-center justify-center ">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-gray-500 ">
                    <Mic size={20} className="group-hover:text-[#30c2a1]" />
                  </div>
                  <div className="my-7 text-[12px]">
                    <p className="rotate-270 text-gray-500 group-hover:text-black whitespace-nowrap">
                      Key Points
                    </p>
                  </div>
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="text-gray-500 text-[10px] "
                  />
                </div>
              </div>
            </CardContent>
          </div>
        )}
      </Card>
    </div>
  );
};
export default RefinePannel;
