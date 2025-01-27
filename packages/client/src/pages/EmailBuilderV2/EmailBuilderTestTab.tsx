import { AxiosError } from "axios";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import { useState } from "react";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import type { CustomerResponse } from "./SearchUser";
import { SearchUser } from "./SearchUser";
import styled from "@emotion/styled";

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

export interface EmailBuilderTestTabProps {
  data: any;
}

const EmailBuilderTestTab = ({ data }: EmailBuilderTestTabProps) => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse>();
  const [isTestLoading, setIsTestLoading] = useState(false);

  const handleTest = async () => {
    if (!selectedCustomer) return;
    console.log("send email");

    setIsTestLoading(true);
    // try {
    //   await ApiService.post({
    //     url: "/events/sendTestEmailByCustomer",
    //     options: { customerId: selectedCustomer.id, emailObject: data },
    //   });
    // } catch (error) {
    //   if (error instanceof AxiosError)
    //     toast.error(error.response?.data?.message);
    //   else toast.error("Unhandled request error");
    // }
    setIsTestLoading(false);
  };

  return (
    <div>
      <StyledMessageContainer>
        <StyledHeaderText>Send an test email</StyledHeaderText>
        <div className="font-inter text-xs text-[#111827] mt-1 mb-2 opacity-70">
          * Test Customer should have an <b>email</b> property
        </div>
        <SearchUser
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          previewFieldKey="phone"
        />
        <Button
          className="mt-4"
          type={ButtonType.PRIMARY}
          disabled={!selectedCustomer?.email}
          onClick={handleTest}
        >
          Send Test
        </Button>
      </StyledMessageContainer>
    </div>
  );
};

export default EmailBuilderTestTab;
