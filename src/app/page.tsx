"use client";
import TextEditor from "@/components/TextEditor";
import Modificationbar from "@/components/Modificationbar";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

export default function Home() {
  const [isModificationBarOpen, setIsModificationBarOpen] = useState(true);
  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans">
      <div className="flex w-full min-h-screen p-4 gap-0">
        <div
          className={` transition-all duration-300 ${
            isModificationBarOpen ? "flex-1" : "flex-[1_1_100%]"
          }`}
        >
          <TextEditor
            isModificationBarOpen={isModificationBarOpen}
            setIsModificationBarOpen={setIsModificationBarOpen}
          />
        </div>

        <div
          className={`transition-all duration-300 overflow-hidden ${
            isModificationBarOpen ? "flex-1 opacity-100" : "w-0 opacity-0"
          }`}
        >
          {isModificationBarOpen && <Modificationbar />}
        </div>
      </div>
    </div>
  );
}
