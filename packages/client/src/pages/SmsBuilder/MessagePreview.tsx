import styled from "@emotion/styled";

const StyledPreview = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 60px - 46px);
`;

const StyledSectionHeaderText = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  position: relative;
`;

const StyledMessageBubble = styled.div`
  max-width: 300px;
  word-wrap: break-word;
  margin-bottom: 12px;
  line-height: 24px;
  position: relative;
  padding: 10px 20px;
  border-radius: 14px;
  background: white;
  align-self: flex-end;

  background: white;
  color: black;
  align-self: flex-start;
  z-index: 1;

  &:before,
  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    height: 25px;
  }

  &:before {
    left: -7px;
    width: 20px;
    background-color: white;
    border-bottom-right-radius: 16px 14px;
  }

  &:after {
    left: -26px;
    width: 26px;
    background-color: #eef2ff;
    border-bottom-right-radius: 10px;
  }
`;

const StyledPreviewContainer = styled.div`
  max-width: 500px;
  background-color: #eef2ff;
  padding: 50px 16px;
  margin: 0;
  overflow-y: auto;
  position: relative;
  height: 100%;
  min-height: 50vh;
  border-top-left-radius: 40px;
  border-top-right-radius: 40px;
  border: 10px solid white;
  border-bottom-width: 0;

  @media (max-width: 1280px) {
    max-height: 50vh;
    overflow-y: auto;
  }
  /* Add these styles to achieve similar visual effect */
  &::-webkit-scrollbar {
    width: 0.4em;
  }

  &::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0);
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

const StyledNotch = styled.div`
  position: absolute;
  background-color: white;
  width: 40%;
  height: 30px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
`;

type MessagePreviewProps = {
  message: string;
};

export const MessagePreview = ({ message }: MessagePreviewProps) => {
  // split the message into chunks of 160 characters
  const chunks: string[] = message.match(/.{1,160}/g) || [];

  return (
    <StyledPreview>
      <StyledSectionHeaderText>Preview</StyledSectionHeaderText>

      <StyledPreviewContainer>
        {chunks.map((item, index) => (
          <StyledMessageBubble key={index}>{item}</StyledMessageBubble>
        ))}
        <StyledNotch />
      </StyledPreviewContainer>
    </StyledPreview>
  );
};
