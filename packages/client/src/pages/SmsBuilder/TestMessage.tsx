import styled from "@emotion/styled";
import { Input } from "components/Elements/";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import { useState } from "react";

const StyledContainer = styled.div`
  padding: 16px;
`;

const StyledMessageContainer = styled(StyledContainer)`
  background-color: white;
  border-radius: 5px;
  width: 100%;
`;

const StyledHeaderText = styled.div`
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  margin-bottom: 16px;
`;

type TestMessageProps = {
  message: string;
};

export const TestMessage = ({ message }: TestMessageProps) => {
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && phoneNumber) {
      console.log("send");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  return (
    <StyledContainer>
      <StyledMessageContainer>
        <StyledHeaderText>Send a test SMS</StyledHeaderText>
        <Input
          value={phoneNumber}
          placeholder={"Example: +1 123 456 7890"}
          name="title"
          id="title"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="text-sm"
        />
        <Button
          className="mt-4"
          type={ButtonType.PRIMARY}
          disabled={!phoneNumber || !message}
          onClick={() => console.log("send")}
        >
          Send Test
        </Button>
      </StyledMessageContainer>
    </StyledContainer>
  );
};
