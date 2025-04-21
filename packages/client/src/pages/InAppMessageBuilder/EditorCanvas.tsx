/* eslint-disable @typescript-eslint/no-shadow */
import React, { useEffect, useState } from "react";
import TemplateLayout from "./TemplateLayout";
import { templates } from "./templates";
import { ITemplate } from "./types";
import screen from "./images/Screen.png";
import { CanvasWrapper, Card } from "./Canvas/CanvasWrapper";

//:TODO Implement zoom in and out
// const Controls = () => {
//   return (
//     <div className="tools">
//       <button onClick={() => zoomIn()}>+</button>
//       <button onClick={() => zoomOut()}>-</button>
//       <button onClick={() => resetTransform()}>x</button>
//     </div>
//   );
// };

const EditorCanvas = ({
  selectedTemplateId,
}: {
  selectedTemplateId: string | null;
}) => {
  let selectedTemplate: ITemplate | null = null;
  templates.find(
    (template) =>
      (selectedTemplate =
        template.templates.find((temp) => temp.id === selectedTemplateId) ||
        null)
  );

  const TemplatePhone = ({
    currentSelectedTemplate,
  }: {
    currentSelectedTemplate: ITemplate | null;
  }) => {
    if (!currentSelectedTemplate) return null;

    const templatePosition =
      currentSelectedTemplate?.layout?.type === "slide-up" ||
      currentSelectedTemplate?.layout?.type === "full-screen"
        ? "translate-y-[0px]"
        : "translate-y-[-25px]";

    const templateJustifyMap = {
      "slide-up": "justify-end",
      modal: "justify-center",
      "full-screen": "justify-start",
    };

    const templateJustify =
      templateJustifyMap[
        currentSelectedTemplate?.layout?.type as keyof typeof templateJustifyMap
      ] || "justify-center";

    return (
      <>
        <div
          className="bg-white w-[390px] h-[827px] rounded-[50px] flex justify-center items-center z-[-2]"
          style={{
            position: "absolute",
            zIndex: -2,
            overflow: "hidden",
          }}
        >
          <img
            src={screen}
            alt="Screen"
            style={{
              width: "375px",
              height: "100%",
              objectFit: "contain",
              zIndex: -1,
            }}
          />
        </div>
        {!!currentSelectedTemplate && (
          <div key={currentSelectedTemplate.id} className="cursor-pointer">
            <div
              className={`w-[390px] h-[827px] flex flex-col ${
                templateJustify || ""
              } items-center align-center ${templatePosition} `}
            >
              <TemplateLayout template={currentSelectedTemplate} />
            </div>
          </div>
        )}
      </>
    );
  };

  const defaultCards = [
    {
      element: <TemplatePhone currentSelectedTemplate={selectedTemplate} />,
      id: "phone",
      coordinates: { x: 0, y: 0 },
    },
  ];
  const [cards, setCards] = useState<Card[]>(defaultCards);

  useEffect(() => {
    let selectedTemplate: ITemplate | null = null;
    templates.find(
      (template) =>
        (selectedTemplate =
          template.templates.find(
            (template) => template.id === selectedTemplateId
          ) || null)
    );

    if (selectedTemplate) {
      setCards([
        {
          element: <TemplatePhone currentSelectedTemplate={selectedTemplate} />,
          id: "phone",
          coordinates: { x: 0, y: 0 },
        },
      ]);
    }
  }, [selectedTemplateId]);

  return <CanvasWrapper setCards={setCards} cards={cards}></CanvasWrapper>;
};

export default EditorCanvas;
