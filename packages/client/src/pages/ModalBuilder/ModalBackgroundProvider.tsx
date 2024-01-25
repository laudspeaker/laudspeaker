import React, { FC, ReactNode } from "react";
import ModalBuilderBackgroundImage from "./Icons/ModalBuilderBackgroundImage.svg";
import GoogleIcon from "./Icons/Google.svg";
import FacebookIcon from "./Icons/Facebook.svg";

interface ModalBackgroundProviderProps {
  children: ReactNode;
}

const ModalBackgroundProvider: FC<ModalBackgroundProviderProps> = ({
  children,
}) => {
  return (
    <>
      <div className="h-screen pt-[60px] font-segoe flex">
        <div className="h-full p-[40px] w-[50%] bg-[#6366F1]">
          <div className="text-white font-semibold leading-[28px] text-[20px]">
            Pretend this is your website 😊
          </div>
          <div className="h-full flex justify-center items-center">
            <img className="w-full" src={ModalBuilderBackgroundImage} alt="" />
          </div>
        </div>
        <div className="w-[50%] px-[10%] py-[50px] flex flex-col gap-[30px]">
          <div className="font-semibold text-[30px] leading-[40px] text-[#111827]">
            Create account
          </div>
          <div className="flex flex-col gap-[15px]">
            <input
              className="w-full rounded-xl border border-[#E5E7EB] py-[14px] px-[11px] placeholder:text-[#9CA3AF] placeholder:leading-[22px] placeholder:font-normal placeholder:text-[14px] text-[14px]"
              placeholder="Your name"
            />
            <input
              className="w-full rounded-xl border border-[#E5E7EB] py-[14px] px-[11px] placeholder:text-[#9CA3AF] placeholder:leading-[22px] placeholder:font-normal placeholder:text-[14px] text-[14px]"
              placeholder="Email"
            />
            <input
              className="w-full rounded-xl border border-[#E5E7EB] py-[14px] px-[11px] placeholder:text-[#9CA3AF] placeholder:leading-[22px] placeholder:font-normal placeholder:text-[14px] text-[14px]"
              placeholder="Password"
            />

            <div className="flex items-center gap-[10px]">
              <input
                name="agree"
                type="checkbox"
                className="border-[0.74px] rounded-[3px] border-[#E5E7EB]"
              />
              <label
                htmlFor="agree"
                className="font-normal text-[12px] leading-5 text-[#4B5563]"
              >
                I agree with <span className="text-[#6366F1]">Terms</span> and{" "}
                <span className="text-[#6366F1]">Privacy</span>
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-[15px]">
            <div className="h-[50px] bg-[#4338CA] rounded-xl flex justify-center items-center font-semibold text-base text-white">
              SIGN UP
            </div>
            <div className="h-[50px] border-[1.5px] border-[#0B465440] rounded-xl flex items-center justify-center text-[#00000080] leading-[22px] text-[14px] font-normal">
              <img src={GoogleIcon} className="w-[12px] h-[12px] mr-[10px]" />
              Sign Up with Google
            </div>
            <div className="h-[50px] border-[1.5px] border-[#0B465440] rounded-xl flex items-center justify-center text-[#00000080] leading-[22px] text-[14px] font-normal">
              <img src={FacebookIcon} className="w-[12px] h-[12px] mr-[10px]" />
              Sign Up with Facebook
            </div>
          </div>
          <div className="flex justify-center items-center font-normal text-[12px] leading-5 text-[#4B5563]">
            Already have an account?
            <span className="text-[#6366F1]">Login</span>
          </div>
        </div>
      </div>

      {children}
    </>
  );
};

export default ModalBackgroundProvider;
