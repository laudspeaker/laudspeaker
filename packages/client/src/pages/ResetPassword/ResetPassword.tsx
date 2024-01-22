import React, { useState } from "react";
import laudspeakerLogo from "../../assets/images/laudspeaker.svg";
import { useParams } from "react-router-dom";
import { GenericButton, Input } from "components/Elements";
import ApiService from "services/api.service";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatNewPassword, setRepeatNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSendLink = async () => {
    setIsSaving(true);
    try {
      await ApiService.post({
        url: "/auth/reset-password",
        options: {
          email,
        },
      });
      toast.success(
        "We have sent a link for password restoration to your email"
      );
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
    if (newPassword !== repeatNewPassword) {
      toast.error("Passwords don't match!");
      return;
    }

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
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src={laudspeakerLogo}
          alt="Laudspeaker"
        />
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Reset your password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full shadow-lg sm:max-w-md">
        <div className="bg-white py-8 px-4 sm:rounded-lg sm:px-10">
          <form className="space-y-6" action="#" method="POST">
            <div>
              {id ? (
                <>
                  <Input
                    name="newPassword"
                    id="newPassword"
                    label="New password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Input
                    name="repeatNewPassword"
                    id="repeatNewPassword"
                    label="Repeat your password"
                    type="password"
                    value={repeatNewPassword}
                    onChange={(e) => setRepeatNewPassword(e.target.value)}
                  />
                </>
              ) : (
                <Input
                  name="email"
                  id="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </div>

            <div>
              <GenericButton
                id="loginIntoAccount"
                customClasses="flex w-full justify-center rounded-md border border-transparent bg-[#6366F1] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#818CF8] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                onClick={id ? handleResetPassword : handleSendLink}
                loading={isSaving}
              >
                Reset password
              </GenericButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
