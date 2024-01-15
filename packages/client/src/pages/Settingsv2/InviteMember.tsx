import { AxiosError } from "axios";
import BackButton from "components/BackButton";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import validator from "validator";

const InviteMember = () => {
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const navigate = useNavigate();

  const handleInvite = async () => {
    if (!validator.isEmail(email)) {
      toast.error("Input should be email");
      return;
    }
    setIsInviting(true);
    try {
      await ApiService.post({
        url: `/organizations/team-members/invite`,
        options: {
          email,
        },
      });
      toast.success("User invited");
      setEmail("");
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message);
      }
    }
    setIsInviting(false);
  };

  return (
    <div className="p-5 flex justify-center font-inter text-[14px] font-normal leading-[22px] text-[#111827]">
      <div className="max-w-[970px] w-full flex flex-col gap-5">
        <div className="flex gap-[15px] items-center">
          <BackButton />
          <div className="text-[20px] font-semibold leading-[28px] text-black">
            Add team member
          </div>
        </div>

        <div className="bg-white p-5 flex flex-col">
          <div className="text-sm font-inter text-[#111827] mb-[5px]">
            Email
          </div>
          <Input
            onChange={(el) => setEmail(el.trim())}
            value={email}
            placeholder="Enter email (i.e. example@email.com)"
            wrapperClassName="!max-w-full w-full"
            className="w-full"
          />
          <hr className="border-[#E5E7EB] my-5" />
          <div className="flex gap-[10px]">
            <Button
              disabled={isInviting || !email || !validator.isEmail(email)}
              className={`${
                isInviting && "pointer-events-none animate-pulse opacity-70"
              }`}
              type={ButtonType.PRIMARY}
              onClick={handleInvite}
            >
              Send invitation
            </Button>
            <Button
              type={ButtonType.SECONDARY}
              onClick={() => {
                navigate("/settings");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InviteMember;
