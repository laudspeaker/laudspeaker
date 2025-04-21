import BodyText from "./elements/BodyText";
import DismissButton from "./elements/DismissButton";
import Image from "./elements/Image";
import PrimaryButton from "./elements/PrimaryButton";
import SecondaryButton from "./elements/SecondaryButton";
import Title from "./elements/Title";
import { ILayout, ITemplate } from "./types";

const mapTemplateElements = (layout: ILayout | null) => {
  if (!layout || !layout.order) {
    return;
  }

  const elements = {
    dismissButton: layout.dismissButton ? (
      <DismissButton element={layout.dismissButton} />
    ) : null,
    title: layout.title ? <Title element={layout.title} /> : null,
    image: layout.image ? <Image element={layout.image} /> : null,
    bodyText: layout.bodyText ? <BodyText element={layout.bodyText} /> : null,
    primaryButton: layout.primaryButton ? (
      <PrimaryButton element={layout.primaryButton} />
    ) : null,
    secondaryButton: layout.secondaryButton ? (
      <SecondaryButton element={layout.secondaryButton} />
    ) : null,
  };

  return layout.order
    .map((element) => elements[element as keyof typeof elements])
    .filter(Boolean);
};

const TemplateLayout = ({
  template,
  isPreview,
}: {
  template: ITemplate;
  isPreview?: boolean;
}) => {
  const canvas = template.layout.canvas;
  const width = isPreview ? canvas.width.value * 0.39 : canvas.width.value;
  const height = isPreview ? canvas.height.value * 0.39 : canvas.height.value;
  const paddingY = isPreview ? canvas.paddingY * 0.39 : canvas.paddingY;
  const paddingX = isPreview ? canvas.paddingX * 0.39 : canvas.paddingX;

  const previewLayout = (layout: ILayout) => {
    const deepTransform = (value: any): any => {
      if (typeof value === "number") {
        return value * 0.39;
      } else if (Array.isArray(value)) {
        return value;
      } else if (typeof value === "object" && value !== null) {
        return Object.entries(value).reduce(
          (acc: Record<string, any>, [key, val]) => ({
            ...acc,
            [key]: deepTransform(val),
          }),
          {}
        );
      }
      return value;
    };

    return Object.entries(layout).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: deepTransform(value),
      }),
      {} as ILayout
    );
  };

  const layout: ILayout | null = isPreview
    ? previewLayout(template.layout)
    : template.layout;

  if (!layout) {
    return null;
  }

  return (
    <div>
      <div
        style={{
          width: `${width}${canvas.width.units}`,
          height: `${height}px`,
          backgroundColor: `${canvas.fill.color}`,
          padding: `${paddingY}px ${paddingX}px`,
          borderRadius: `${canvas.borderRadius}px`,
          borderBottomLeftRadius: `${
            layout?.type === "slide-up" && !isPreview
              ? "50px"
              : canvas.borderRadius + "px"
          }`,
          borderBottomRightRadius: `${
            layout?.type === "slide-up" && !isPreview
              ? "50px"
              : canvas.borderRadius + "px"
          }`,
        }}
        className={`font-pingFangSC text relative`}
      >
        {!!layout && //@ts-ignore
          mapTemplateElements(layout)?.map((Element: JSX.Element) => {
            return <>{Element}</>;
          })}
      </div>
    </div>
  );
};

export default TemplateLayout;
