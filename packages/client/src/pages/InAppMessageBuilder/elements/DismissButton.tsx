import CloseIcon from "@heroicons/react/20/solid/XMarkIcon";
import { IDismissButton } from "../types";

const DismissButton = ({ element }: { element: IDismissButton }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: `${element.positionCoordinates.y}px`,
        right: `${element.positionCoordinates.x}px`,
      }}
    >
      <CloseIcon
        width={`${element.width.value}${element.width.units}`}
        height={`${element.height}${element.width.units}`}
        fillOpacity={element.fill.opacity}
        fill={element.fill.color}
      />
    </div>
  );
};

export default DismissButton;
