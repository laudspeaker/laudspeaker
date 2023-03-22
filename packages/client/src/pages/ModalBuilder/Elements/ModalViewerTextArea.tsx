import useAutoResizeTextArea from "hooks/useAutoResizeTextArea";
import React, { CSSProperties, FC, useRef } from "react";
import { useClickAway } from "react-use";

interface ModalViewerTextAreaProps {
  onChange: (value: string) => void;
  value: string;
  onClickAway?: () => void;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

const ModalViewerTextArea: FC<ModalViewerTextAreaProps> = ({
  onChange,
  value,
  className,
  style,
  onClickAway,
  id,
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useAutoResizeTextArea(textAreaRef.current, value);
  useClickAway(textAreaRef, () => {
    onClickAway?.();
  });

  setTimeout(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "0px";
      const scrollHeight = textAreaRef.current.scrollHeight;

      textAreaRef.current.style.height = scrollHeight + "px";
    }
  }, 1);

  return (
    <textarea
      className={`w-full h-auto bg-transparent border-transparent overflow-hidden ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      ref={textAreaRef}
      style={style}
      onClick={(e) => e.stopPropagation()}
      id={id}
    />
  );
};

export default ModalViewerTextArea;
