import { ITextElement } from "../types";

const Title = ({ element }: { element: ITextElement }) => {
  return (
    <div
      style={{
        fontSize: `${element.fontSize}px`,
        fontWeight: element.fontWeight,
        fontStyle: element.fontStyle,
        textDecoration: element.textDecoration.join(" "),
        textAlign: element.textAlign,
        color: element.color,
        marginBottom: `${element.bottomMargin}px`,
        lineHeight: `${element.lineHeight}` || `${element.lineHeightPx}px` || 1,
      }}
    >
      {element.value}
    </div>
  );
};

export default Title;
