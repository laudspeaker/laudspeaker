import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDrop, useWindowSize } from "react-use";

interface ICancelDropZoneProps {
  countRef: React.RefObject<HTMLDivElement>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
}

const CancelDropZone = ({ countRef, onDrop }: ICancelDropZoneProps) => {
  useDrop();
  const { width, height } = useWindowSize();
  const [rect, setRect] = useState(
    countRef.current?.getBoundingClientRect() || { x: 0, y: 0, width: 0 }
  );
  useEffect(() => {
    if (!countRef.current) return;
    setRect(countRef.current.getBoundingClientRect());
  }, [width, height]);

  if (typeof document.body !== "object" || !countRef.current) return <></>;

  return createPortal(
    <>
      <div
        className={`fixed h-screen top-0 left-0 bg-transparent z-[10000]`}
        style={{ width: rect.x }}
        onDrop={onDrop}
        onMouseMove={onDrop}
      />
      <div
        className={`fixed right-0 top-0 bg-transparent z-[10000]`}
        style={{ width: rect.width, height: rect.y }}
        onDrop={onDrop}
        onMouseMove={onDrop}
      />
    </>,
    document.body
  );
};

export default CancelDropZone;
