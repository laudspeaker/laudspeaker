import { IImageElement } from "../types";

const Image = ({ element }: { element: IImageElement }) => {
  return (
    <img
      src={element.src}
      alt="Image Placeholder"
      style={{
        width: `${element.width.value}${element.width.units}`,
        height: `${element.height}px`,
        borderRadius: `${element.borderRadius}px`,
        marginBottom: `${element.bottomMargin}px`,
        alignSelf: "center",
        placeSelf: "center",
      }}
      className={`object-cover`}
    />
  );
};

export default Image;
