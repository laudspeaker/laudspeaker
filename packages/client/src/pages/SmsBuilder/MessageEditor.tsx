import styled from "@emotion/styled";
import { Textarea } from "components/Elements";
import { ChangeEvent } from "react";
import { useParams } from "react-router-dom";

const StyledMessageEditor = styled.div`
  background-color: white;
  height: 100%;
  max-height: calc(100vh - 60px - 46px);
`;

const StyledTextArea = styled(Textarea)`
  margin-top: 16px;
  font-size: 14px;
`;

const StyledMessageContainer = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
`;

const StyledMessageStats = styled.div`
  padding: 0 16px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #4b5563;
`;

const StyledSectionHeaderText = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

type MessageEditorProps = {
  message: string;
  setMessage: (message: string) => void;
};

export const MessageEditor = ({ message, setMessage }: MessageEditorProps) => {
  const { id } = useParams();

  const messageLength = message.length ?? 0;
  const messageChunks = (message.match(/.{1,160}/g) || []).length;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  return (
    <StyledMessageEditor>
      <StyledMessageContainer>
        <StyledSectionHeaderText>SMS message</StyledSectionHeaderText>
        <StyledTextArea
          isRequired
          value={message}
          placeholder={"Enter the body of your message"}
          name={"name"}
          id={id}
          onChange={handleChange}
          maxLength={1600}
        />
      </StyledMessageContainer>
      <StyledMessageStats>
        <div>
          This message will be sent as {messageChunks || 1} part
          {messageChunks > 1 ? "s" : ""}
        </div>
        <div>{messageLength}/1600</div>
      </StyledMessageStats>
    </StyledMessageEditor>
  );
};
