import FilterBuilder from "pages/FlowBuilderv2/FilterBuilder/FilterBuilder";
import FilterViewer from "pages/FlowBuilderv2/FilterViewer/FilterViewer";
import React, { FC } from "react";
import { Query, SegmentsSettingsType } from "reducers/flow-builder.reducer";

interface AutomaticSegmentViewerProps {
  isEditing: boolean;
  query: Query;
  setQuery: (value: Query) => void;
}

const AutomaticSegmentViewer: FC<AutomaticSegmentViewerProps> = ({
  isEditing,
  query,
  setQuery,
}) => {
  if (!isEditing) return <FilterViewer settingsQuery={query} />;

  return (
    <FilterBuilder
      settings={{ type: SegmentsSettingsType.CONDITIONAL, query }}
      onSettingsChange={(settings) => {
        setQuery(settings.query);
      }}
    />
  );
};

export default AutomaticSegmentViewer;
