import { SplitTreatments } from "@splitsoftware/splitio-react";

export default function RenderWhenOn({
  featureName,
  children,
}: {
  featureName: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <SplitTreatments names={[featureName]}>
      {({ treatments, isReady }) => {
        if (!isReady) {
          return <></>;
        }
        const { treatment } = treatments[featureName];
        if (treatment === "on") {
          return <>{children}</>;
        }
        return <></>;
      }}
    </SplitTreatments>
  );
}
