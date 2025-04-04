import useWindowDimensions from "hooks/useWindowDimensions";
import { debounce } from "lodash";
import { FC, ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Node, useViewport } from "reactflow";
import "tailwindcss/tailwind.css";
import { NodeData } from "./Nodes/NodeData";

interface Coordinates {
  x: number;
  y: number;
}

interface MouseTrackerProps {
  children: ReactNode;
  isVisible: boolean;
  coordinates: Coordinates;
  flowRef?: React.RefObject<HTMLDivElement> | null;
  setStateChanges: (state: any) => void;
  selectedNode?: Node<NodeData>;
}

interface RectangleBoxProps {
  size: {
    x: number;
    y: number;
  };
}

const MouseTracker: FC<MouseTrackerProps> = ({
  children,
  isVisible,
  coordinates,
  flowRef,
  setStateChanges,
  selectedNode,
}) => {
  const element = useRef<HTMLDivElement>(null);
  const windowDimensions = useWindowDimensions();
  const { x: viewX, y: viewY, zoom } = useViewport();
  const viewport = useViewport();

  useEffect(() => {
    function handler(e: MouseEvent) {
      // console.log(e, "handler");

      const x = e ? e.clientX : coordinates.x;
      const y = e ? e.clientY : coordinates.y;
      if (e && flowRef && flowRef.current) {
        const boudingClientRect = flowRef?.current?.getBoundingClientRect();
        if (!boudingClientRect) return;
        // console.log(boudingClientRect, "boudingClientRect");

        const canvasMouseX = (x - viewX - boudingClientRect.left) / zoom;

        const canvasMouseY = (y - viewY - boudingClientRect.top) / zoom;
        // setStateChanges({ x: canvasMouseX, y: canvasMouseY });
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

    // document.addEventListener("mousemove", handler);

    return () => {
      // document.removeEventListener("mousemove", handler);
    };
  }, []);

  useEffect(() => {
    // const handleMovement = debounce(() => {
    if (!element.current) return;
    const nodeRect = flowRef?.current?.getBoundingClientRect();
    if (!nodeRect) return;
    console.log(
      coordinates.x,
      "coordinates.x",
      viewX,
      "viewX",
      nodeRect.left,
      "nodeRect.left"
    );

    const canvasMouseX = coordinates.x + viewX - nodeRect.left / zoom;
    const canvasMouseY = coordinates.y - viewY - nodeRect.top / zoom - 550;
    // const x = coordinates.x * zoom + viewX * 2 - nodeRect.x; //720
    const x = (coordinates.x + nodeRect.x * 2) * zoom + 150;
    const y = (coordinates.y - nodeRect.y * 2) * zoom;
    // const y = coordinates.y * zoom - viewY * 2 - nodeRect.y * 2; //370
    console.log(
      x,
      y,
      "xxxxxxxx",
      viewX,
      viewY,
      nodeRect,
      // canvasMouseX,
      // canvasMouseY,
      coordinates.x,
      coordinates.y
    );
    element.current.style.transform = `translate(${canvasMouseX}px, ${canvasMouseY}px)`;
    // }, 100);
    // handleMovement();
  }, [coordinates]);

  useEffect(() => {
    if (!element.current) return;
    if (isVisible) {
      element.current.style.visibility = "visible";
    } else {
      element.current.style.visibility = "hidden";
    }
  }, [isVisible]);

  const RectangleBox: FC<RectangleBoxProps> = ({ size }) => {
    if (!size) return null;
    const { x, y } = size;
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: x,
          height: y,
          border: "2px solid black",
          pointerEvents: "none",
          background: "white",
        }}
      />
    );
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        pointerEvents: "none",
        visibility: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif", // Assuming the font for titles in nodes is Arial
        fontSize: "16px", // Adjust the font size as needed
      }}
      ref={element}
    >
      <RectangleBox size={{ x: 206, y: 64 }} />
      {selectedNode?.data?.customName && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            width: "100%",
          }}
        >
          {selectedNode.data.customName}
        </div>
      )}
      {children}
    </div>,
    document.body
  );
};

export default MouseTracker;
