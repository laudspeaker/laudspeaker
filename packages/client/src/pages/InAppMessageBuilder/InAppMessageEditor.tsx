import styled from "@emotion/styled";
import EditorCanvas from "./EditorCanvas";

const StyledMessageEditor = styled.div`
  background-color: #f3f4f6;
  height: 100%;
  max-height: calc(100vh - 60px - 46px);
`;

const InAppMessageEditor = ({
  selectedTemplateId,
}: {
  selectedTemplateId: string | null;
}) => {
  return (
    <StyledMessageEditor>
      <EditorCanvas selectedTemplateId={selectedTemplateId} />
    </StyledMessageEditor>
  );
};

export default InAppMessageEditor;
