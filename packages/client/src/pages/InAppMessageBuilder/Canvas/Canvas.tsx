import { DndContext, useDroppable } from "@dnd-kit/core";
import { DragEndEvent } from "@dnd-kit/core/dist/types";
import { select } from "d3-selection";
import { ZoomTransform, zoom } from "d3-zoom";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { Card } from "./CanvasWrapper";
import { Draggable } from "./Draggable";

export const Canvas = ({
  cards,
  setCards,
  transform,
  setTransform,
}: {
  cards: Card[];
  setCards: (cards: Card[]) => void;
  transform: ZoomTransform;
  setTransform(transform: ZoomTransform): void;
}) => {
  const updateDraggedCardPosition = ({ delta, active }: DragEndEvent) => {
    if (!delta.x && !delta.y) return;
    setCards(
      cards.map((card) => {
        if (card.id === active.id) {
          return {
            ...card,
            coordinates: {
              x: card.coordinates?.x + delta.x / transform?.k,
              y: card.coordinates?.y + delta.y / transform?.k,
            },
          };
        }
        return card;
      })
    );
  };

  const { setNodeRef } = useDroppable({
    id: "canvas",
  });

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const updateAndForwardRef = (div: HTMLDivElement) => {
    canvasRef.current = div;
    setNodeRef(div);
  };

  // create the d3 zoom object, and useMemo to retain it for rerenders
  const zoomBehavior = useMemo(() => zoom<HTMLDivElement, unknown>(), []);

  // update the transform when d3 zoom notifies of a change
  const updateTransform = useCallback(
    ({ transformValue }: { transformValue: ZoomTransform }) => {
      setTransform(transformValue);
    },
    [setTransform]
  );

  useLayoutEffect(() => {
    if (!canvasRef.current) return;

    // get transform change notifications from d3 zoom
    zoomBehavior.on("zoom", updateTransform);

    // attach d3 zoom to the canvas div element, which will handle
    // mousewheel, gesture and drag events automatically for pan / zoom
    select<HTMLDivElement, unknown>(canvasRef.current).call(zoomBehavior);
  }, [zoomBehavior, canvasRef, updateTransform]);

  return (
    <div ref={updateAndForwardRef} className="canvasWindow">
      <div
        className="canvas"
        style={{
          // apply the transform from d3
          transformOrigin: "top left",
          transform: `translate3d(${transform?.x}px, ${transform?.y}px, ${transform?.k}px)`,
          position: "relative",
          height: "300px",
        }}
      >
        <DndContext onDragEnd={updateDraggedCardPosition}>
          {cards.map((card) => (
            <Draggable card={card} key={card.id} canvasTransform={transform} />
          ))}
        </DndContext>
      </div>
    </div>
  );
};
