import { RefObject, useState } from "react";
import { useEventListener } from "usehooks-ts";

export default <T extends HTMLElement = HTMLElement>(
  elementRef: RefObject<T>
) => {
  const [value, setValue] = useState(false);

  const handleMouseEnter = () => {
    setValue(true);
  };
  const handleMouseLeave = () => {
    setValue(false);
  };

  useEventListener("mouseenter", handleMouseEnter, elementRef);
  useEventListener("mouseleave", handleMouseLeave, elementRef);

  return value;
};
