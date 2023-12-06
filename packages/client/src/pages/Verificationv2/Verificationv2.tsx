import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import verificationLaudspeakerHeaderImage from "./svg/verification-laudspeaker-header.svg";
import verificationIconImage from "./svg/verification-icon.svg";
import successfullVerificationCheckImage from "./svg/successfull-verification-check-circle.svg";
import { useNavigate } from "react-router-dom";
import Timer from "components/Timer";
import { useInterval } from "react-use";
import { useAppSelector } from "store/hooks";

const Verificationv2 = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isToastLocked, setIsToastLocked] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(300);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data } = await ApiService.get({ url: "/accounts" });
      const {
        email: emailFromRequest,
        verified,
        secondtillunblockresend,
      } = data;
      setEmail(emailFromRequest);
      setIsVerified(verified);
      setTimerSeconds(Math.ceil(+secondtillunblockresend || 0));
    } catch (e) {
      if (!isToastLocked) {
        toast.error("Error while loading data");
        setIsToastLocked(true);

        setTimeout(() => setIsToastLocked(false), 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    await ApiService.patch({ url: "/auth/resend-email", options: {} });
    await loadData();
    toast.info("We have sent you new email", {
      position: "bottom-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  useInterval(() => {
    loadData();
  }, 1000);

  useEffect(() => {
    if (!isVerified) return;

    setTimeout(() => navigate("/"), 2000);
  }, [isVerified]);

  return (
    <div className="w-full min-h-screen h-full bg-[#F3F4F6] flex flex-col gap-5 py-5 items-center font-inter font-normal text-[14px] leading-[22px] text-[#111827]">
      <div>
        <img src={verificationLaudspeakerHeaderImage} />
      </div>

      <div className="max-w-[800px] min-h-[532px] p-[40px] rounded-xl bg-white flex flex-col items-center gap-[60px]">
        {isVerified ? (
          <>
            <div>
              <img src={successfullVerificationCheckImage} />
            </div>

            <div className="flex flex-col gap-5 text-center">
              <div className="font-roboto text-[30px] font-medium leading-[40px] w-[800px]">
                Email Verification Successful!
              </div>

              <div className="font-semibold">
                Redirecting to the homepage of our platform...
              </div>

              <div className="font-semibold">
                If the redirection doesn't occur, click{" "}
                <button className="underline text-[#6366F1]" onClick={() => {}}>
                  here
                </button>{" "}
                to proceed.
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <img src={verificationIconImage} />
            </div>

            <div className="flex flex-col items-center text-center gap-5">
              <div className="font-roboto font-normal text-[30px] leading-[40px]">
                Verify your email address
              </div>
              <div>
                👋 Welcome to our platform! We have sent a verification email to
                your email <span className="text-[#6366F1]">{email}</span>.
                Please check your inbox and click on the link to complete the
                verification process.
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-5">
              <div>
                If you did not receive the verification email, click the button
                below to resend the verification email.
              </div>

              {timerSeconds ? (
                <button className="px-[30px] py-[10px] rounded-[30px] bg-[#D1D5DB] text-[#4B5563] text-[16px] font-inter font-semibold leading-[22px]">
                  Resend Email in{" "}
                  <Timer
                    seconds={timerSeconds}
                    setSeconds={setTimerSeconds}
                    onFinish={() => {}}
                  />
                </button>
              ) : (
                <button
                  className="px-[30px] py-[10px] rounded-[30px] bg-[#6366F1] text-white text-[16px] font-inter font-semibold leading-[24px]"
                  onClick={handleResend}
                >
                  Resend email
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Verificationv2;
