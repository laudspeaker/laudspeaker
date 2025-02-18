import useWindowDimensions from "hooks/useWindowDimensions";
import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useViewport } from "reactflow";
import "tailwindcss/tailwind.css";

const MouseTracker = ({
  children,
  isVisible,
  coordinates,
  flowRef,
}: {
  children: ReactNode;
  isVisible: boolean;
  coordinates: { x: number; y: number };
  flowRef?: React.RefObject<HTMLDivElement> | null;
}) => {
  const element = useRef<HTMLDivElement>(null);
  const windowDimensions = useWindowDimensions();
  const { x: viewX, y: viewY, zoom } = useViewport();
  const viewport = useViewport();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (element.current) {
        // console.log(e, "moving mouse");
        // const x = e.clientX,
        //   y = e.clientY - (e.view?.innerHeight || 0);
        // element.current.style.transform = `translate(${x}px, ${y}px)`;
        // if (!isVisible) {
        //   element.current.style.visibility = "hidden";
        // } else {
        //   element.current.style.visibility = "visible";
        // }
      }
    }
    // if (isVisible) {
    document.addEventListener("mousemove", handler);
    // } else {
    //   document.removeEventListener("mousemove", handler);
    // }
    return () => {
      document.removeEventListener("mousemove", handler);
    };
  }, []);

  useEffect(() => {
    if (!element.current) return;
    const nodeRect = flowRef?.current?.getBoundingClientRect();
    const x = coordinates.x * zoom + 700 - (nodeRect ? nodeRect.left : 0);
    const y = coordinates.y * zoom - 330 - (nodeRect ? nodeRect.top : 0);
    element.current.style.transform = `translate(${x}px, ${y}px)`;
  }, [coordinates]);

  useEffect(() => {
    if (!element.current) return;
    if (isVisible) {
      element.current.style.visibility = "visible";
    } else {
      element.current.style.visibility = "hidden";
    }
  }, [isVisible]);

  return createPortal(
    <div
      style={{
        position: "fixed",
        pointerEvents: "none",
        visibility: "hidden",
      }}
      ref={element}
    >
      {children}
    </div>,
    document.body
  );
};

export default MouseTracker;
