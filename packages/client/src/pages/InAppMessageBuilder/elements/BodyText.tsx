import { ITextElement } from "../types";

const BodyText = ({ element }: { element: ITextElement }) => {
  return (
    <p
      style={{
        fontSize: `${element.fontSize}px`,
        fontWeight: element.fontWeight,
        fontStyle: element.fontStyle,
        textDecoration: element.textDecoration.join(" "),
        textAlign: element.textAlign,
        color: element.color,
        marginBottom: `${element.bottomMargin}px`,
        lineHeight:
          `${element.lineHeight}` || `${element.lineHeightPx}px` || 1.4,
      }}
    >
      {element.value}
    </p>
  );
};

export default BodyText;
