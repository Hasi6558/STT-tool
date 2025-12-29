import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FeatherIcon } from "lucide-react";
import React from "react";

interface ArrowButtonProps {
  direction?: "up" | "down" | "left" | "right";
}
const ArrowButton = ({ direction }: ArrowButtonProps) => {
  return (
    <div>
      {direction === "up" && (
        <FontAwesomeIcon
          icon={faChevronUp}
          className="text-xs sm:text-[10px] text-black"
        />
      )}
      {direction === "left" && (
        <FontAwesomeIcon
          icon={faChevronLeft}
          className="text-sm sm:text-[10px] text-black"
        />
      )}
      {direction === "right" && (
        <FontAwesomeIcon
          icon={faChevronRight}
          className="text-sm sm:text-[10px] text-black"
        />
      )}
      {direction === "down" && (
        <FontAwesomeIcon
          icon={faChevronDown}
          className="text-sm sm:text-[10px] text-black"
        />
      )}
    </div>
  );
};

export default ArrowButton;
