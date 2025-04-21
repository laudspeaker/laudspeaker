import { useDraggable } from "@dnd-kit/core";
import { ZoomTransform } from "d3-zoom";
import { Card } from "./CanvasWrapper";

export const Draggable = ({
  card,
  canvasTransform,
}: {
  card: Card;
  canvasTransform: ZoomTransform;
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id,
  });

  return (
    <div
      className="card"
      style={{
        position: "absolute",
        top: `${card.coordinates.y * canvasTransform?.k}px`,
        left: `${card.coordinates.x * canvasTransform?.k}px`,
        transformOrigin: "top left",
        ...(transform
          ? {
              // temporary change to this position when dragging
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0px) scale(${canvasTransform?.k})`,
            }
          : {
              // zoom to canvas zoom
              transform: `scale(${canvasTransform?.k})`,
            }),
      }}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      // this stops the event bubbling up and triggering the canvas drag
      onPointerDown={(e) => {
        listeners?.onPointerDown?.(e);
        e.preventDefault();
      }}
    >
      {card.element}
    </div>
  );
};
