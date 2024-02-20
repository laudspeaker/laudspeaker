import styled from "@emotion/styled";
import { Input } from "components/Elements/";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import { CustomerResponse, SearchUser } from "pages/PushBuilder/SearchUser";
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
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse>();

  return (
    <StyledContainer>
      <StyledMessageContainer>
        <StyledHeaderText>Send a test SMS</StyledHeaderText>
        <SearchUser
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          previewFieldKey="phone"
        />
        <Button
          className="mt-4"
          type={ButtonType.PRIMARY}
          disabled={!selectedCustomer?.phone || !message}
          onClick={() => console.log("send")}
        >
          Send Test
        </Button>
      </StyledMessageContainer>
    </StyledContainer>
  );
};
