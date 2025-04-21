import { IButton } from "../types";

const PrimaryButton = ({ element }: { element: IButton }) => {
  return (
    <button
      style={{
        width: `${element.width.value}${element.width.units}`,
        height: `${element.height}${element.width.units}`,
        fontSize: `${element.fontSize}px`,
        color: element.fontColor,
        background: element.fill.color,
        borderColor: element.border.color,
        borderRadius: element.borderRadius,
        marginBottom: `${element.bottomMargin}px`,
        placeSelf: element.position,
        position: element.isAbsolute ? "absolute" : "relative",
        bottom: element.absolutePosition ? element.absolutePosition.y : "0px",
        right: element.absolutePosition ? element.absolutePosition.x : "0px",
      }}
    >
      {element.value}
    </button>
  );
};

export default PrimaryButton;
