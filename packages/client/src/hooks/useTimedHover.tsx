import { RefObject, useEffect, useState } from "react";
import { useEventListener } from "usehooks-ts";

const useTimedHover = <T extends HTMLElement = HTMLElement>(
  elementRef: RefObject<T>,
  ms: number
): boolean => {
  const [value, setValue] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    setValue(false);
    setIsHovered(false);
  };

  useEffect(() => {
    if (isHovered) {
      setTimeout(() => {
        if (isHovered) {
          setValue(true);
        }
      }, ms);
    }
  }, [isHovered]);

  useEventListener("mouseenter", handleMouseEnter, elementRef);
  useEventListener("mouseleave", handleMouseLeave, elementRef);

  return value;
};

export default useTimedHover;
