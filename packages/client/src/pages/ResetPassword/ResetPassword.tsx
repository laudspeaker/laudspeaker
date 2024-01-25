import { useState } from "react";
import { useParams } from "react-router-dom";
import { Input } from "components/Elements";
import ApiService from "services/api.service";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import laudspeakerHeader from "../../assets/images/laudspeaker-header.svg";
import ShowPasswordIcon from "assets/icons/ShowPasswordIcon";
import PasswordChecklist from "react-password-checklist";

const ResetPassword = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatNewPassword, setRepeatNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isInvalid = {
    pass:
      !newPassword.trim() ||
      !repeatNewPassword.trim() ||
      newPassword.trim().length <= 8 ||
      repeatNewPassword.trim().length <= 8 ||
      repeatNewPassword.trim() !== newPassword.trim(),
    email: !email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/),
  };

  const handleSendLink = async () => {
    setIsSaving(true);
    try {
      await ApiService.post({
        url: "/auth/reset-password",
        options: {
          email,
        },
      });
      toast.success("We have sent a password reset link to your email.");
      navigate("/login");
    } catch (e) {
      let message = "Something went wrong while sending email";
      if (e instanceof AxiosError) {
        message = e.response?.data?.message || message;
      }
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    setIsSaving(true);
    try {
      await ApiService.post({
        url: "/auth/reset-password/" + id,
        options: {
          password: newPassword,
        },
      });
      toast.success("You have successfully recovered your password!");
      navigate("/login");
    } catch (e) {
      let message = "Something went wrong while resetting your password";
      if (e instanceof AxiosError) {
        console.log(e);
        message =
          (Array.isArray(e.response?.data?.message)
            ? e.response?.data?.message[0]
            : e.response?.data?.message) || message;
      }
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center items-center gap-10 bg-[#F3F4F6] font-inter text-[#111827] text-[14px] leading-[22px]">
      <img src={laudspeakerHeader} alt="Laudspeaker" />

      <div
        className="w-[480px] bg-white p-10 rounded-xl flex flex-col items-center gap-5"
        style={{
          boxShadow: "0px 2px 0px 0px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div className="font-roboto text-[30px] font-bold leading-10">
          {id ? "Reset Your Password" : "Recover Your Account"}
        </div>
        <form className="w-full flex flex-col gap-5" action="">
          {id ? (
            <>
              <div className="flex flex-col gap-2.5">
                <label
                  htmlFor="password"
                  className="block text-[16px] font-semibold leading-[24px]"
                >
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="!w-full !py-2 !rounded-sm"
                    wrapperClassName="!w-full"
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 right-3 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <ShowPasswordIcon />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <label
                  htmlFor="password"
                  className="block text-[16px] font-semibold leading-[24px]"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="password"
                    value={repeatNewPassword}
                    onChange={(e) => setRepeatNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="!w-full !py-2 !rounded-sm"
                    wrapperClassName="!w-full"
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 right-3 cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <ShowPasswordIcon />
                  </div>
                </div>
              </div>
              <PasswordChecklist
                rules={[
                  "minLength",
                  "specialChar",
                  "number",
                  "letter",
                  "match",
                ]}
                messages={{
                  minLength: "Contains 8 or more characters.",
                  specialChar: "Contains at least one special character.",
                  number: "Contains at least one number.",
                  letter: "Contains at least one letter.",
                  match: "Passwords match.",
                }}
                className="mt-2 text-sm"
                iconSize={16}
                minLength={8}
                value={newPassword}
                valueAgain={repeatNewPassword}
                onChange={(isValid) => {}}
              />
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="block text-[16px] font-semibold leading-[24px]"
              >
                Email Address
              </label>
              {/* <div className="text-[#4B5563] font-inter text-xs my-[10px]">
                We will send a confirmation email to this address:
              </div> */}
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="!w-full !py-2 !rounded-sm"
                wrapperClassName="!w-full"
                placeholder="you@example.com"
              />
            </div>
          )}
          <div>
            <button
              id="loginIntoAccount"
              className="flex w-full h-[44px] items-center disabled:text-white disabled:bg-[#D1D5DB] disabled:border-[#D1D5DB] justify-center rounded-md border border-transparent bg-[#6366F1] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#818CF8] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              onClick={id ? handleResetPassword : handleSendLink}
              disabled={
                id ? isSaving || isInvalid.pass : isSaving || isInvalid.email
              }
            >
              {id ? "Reset Password" : "Send Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
