import { ClientRect, DndContext, Over, UniqueIdentifier } from "@dnd-kit/core";
import { Coordinates, Translate } from "@dnd-kit/core/dist/types";
import { useState } from "react";
import "./CanvasWrapper.css";
import { Canvas } from "./Canvas";
import { zoomIdentity, ZoomTransform } from "d3-zoom";

export type Card = {
  id: UniqueIdentifier;
  coordinates: Coordinates;
  element?: JSX.Element;
};

const calculateCanvasPosition = (
  initialRect: ClientRect,
  over: Over,
  delta: Translate,
  transform: ZoomTransform
): Coordinates => ({
  x:
    (initialRect.left + delta.x - (over?.rect?.left ?? 0) - transform.x) /
    transform.k,
  y:
    (initialRect.top + delta.y - (over?.rect?.top ?? 0) - transform.y) /
    transform.k,
});

export const CanvasWrapper = ({
  cards,
  setCards,
}: {
  cards: Card[];
  setCards: (cards: Card[]) => void;
}) => {
  // store the current transform from d3
  const [transform, setTransform] = useState(zoomIdentity);

  return (
    <DndContext>
      <Canvas
        cards={cards}
        setCards={setCards}
        transform={transform}
        setTransform={setTransform}
      />
    </DndContext>
  );
};
