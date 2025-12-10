"use client";

import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";

interface NavbarProps {
  onPDFDownload: () => void;
}

export default function Navbar({ onPDFDownload }: NavbarProps) {
  return (
    <nav className="w-full border-b bg-white">
      <div className="flex justify-between items-center my-2 sm:my-4 mx-2 sm:mx-4 md:mx-6 lg:px-16">
        <div className="flex items-center justify-between">
          <FontAwesomeIcon
            icon={faMicrophone}
            className="bg-[#30c2a1] text-white p-1.5 sm:p-2 border rounded-lg mr-1 sm:mr-2"
          />
          <span className="font-bold text-xs sm:text-sm md:text-xl">
            Speech to Text Writing Tool
          </span>
        </div>
        <Button
          className="bg-[#30c2a1] hover:bg-[#28a88c] text-xs sm:text-sm px-2 sm:px-4"
          onClick={onPDFDownload}
        >
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </div>
    </nav>
  );
}
