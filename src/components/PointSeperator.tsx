import { List, Mic, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

interface Point {
  id: string;
  text: string;
}

interface Section {
  id: string;
  title: string;
  summary: string;
  points: Point[];
}

const dummyData: Section[] = [
  {
    id: "section_1",
    title: "Introduction",
    summary: "Brief overview of the main idea",
    points: [
      {
        id: "point_1",
        text: "Technology is the most effective way to create large-scale change.",
      },
      {
        id: "point_2",
        text: "It enables solutions to scale faster than traditional methods.",
      },
    ],
  },
  {
    id: "section_2",
    title: "Supporting Arguments",
    summary: "Reasons that support the main idea",
    points: [
      {
        id: "point_3",
        text: "Software can reach millions of users at low cost.",
      },
      {
        id: "point_4",
        text: "Automation increases efficiency and reduces human error.",
      },
    ],
  },
];
interface PointSeparatorProps {
  isPointSeparatorOpen: boolean;
  setIsPointSeparatorOpen: (open: boolean) => void;
}

const PointSeparator = ({
  isPointSeparatorOpen,
  setIsPointSeparatorOpen,
}: PointSeparatorProps) => {
  const [points, setPoints] = useState<Section[]>(dummyData);

  return (
    <div className="w-full h-full">
      <Card
        className={`relative h-full overflow-hidden ${
          !isPointSeparatorOpen ? "hover:bg-gray-100 " : ""
        }`}
        onClick={() => {
          if (!isPointSeparatorOpen) {
            setIsPointSeparatorOpen(true);
          }
        }}
      >
        {isPointSeparatorOpen ? (
          <CardHeader className="border-b-1 pb-3 relative">
            <div className="w-full flex justify-between w-full">
              <div className="flex items-center gap-2">
                <List size={17} color="#30c2a1" />
                <h2 className="font-bold text-[17px]">Key Points</h2>
              </div>
              <Button className="bg-[#30c2a1] hover:bg-[#28a88c] text-xs sm:text-sm md:text-[16px] h-9 sm:h-10 md:h-10 px-3 sm:px-4 md:px-6 rounded-xl">
                <Sparkles /> Extract Points
              </Button>
            </div>
            {isPointSeparatorOpen && (
              <div className="absolute top-[-40px] left-1/2 transform -translate-x-1/2 flex justify-center items-start pt-2 sm:pt-4 hidden lg:flex">
                <Button
                  className="h-8 w-8 sm:h-8 sm:w-8 bg-zinc-100 hover:bg-zinc-300 shadow-md text-zinc-300 opacity-100 hover:opacity-100 transition-all"
                  onClick={() => setIsPointSeparatorOpen(!isPointSeparatorOpen)}
                  title={"Close sidebar"}
                >
                  <FontAwesomeIcon
                    icon={faChevronUp}
                    className="text-xs sm:text-sm text-black"
                  />
                </Button>
              </div>
            )}
          </CardHeader>
        ) : (
          <div className="group h-full flex flex-col justify-center items-center overflow-hidden">
            <CardContent className="hover:bg-gray-100 transition-all duration-300 h-full overflow-hidden">
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

export default PointSeparator;
