import React, { ChangeEvent, FC, MouseEvent, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { signUpUser, ISignUpForm } from "../../reducers/auth.reducer";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import laudspeakerLogo from "../../assets/images/laudspeaker.svg";
import Tooltip from "components/Elements/Tooltip";
import { toast } from "react-toastify";
import Link from "components/Link/Link";
import { AxiosError } from "axios";
import githubIcon from "../../assets/images/github.svg";
import googleIcon from "../../assets/images/google.svg";
import gitlabIcon from "../../assets/images/gitlab.svg";
import { useParams } from "react-router-dom";
import { InviterData } from "EE/InviteConfirmation";
import ApiService from "services/api.service";
import { TailSpin } from "react-loader-spinner";
import laudspeakerHeader from "../../assets/images/laudspeaker-header.svg";
import ShowPasswordIcon from "assets/icons/ShowPasswordIcon";
import PasswordChecklist from "react-password-checklist";

export interface SignupProps {
  fromInvite?: boolean;
  setShowWelcomeBanner: (value: boolean) => void;
}

const Signup: FC<SignupProps> = ({ fromInvite, setShowWelcomeBanner }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loadingTokenConfirmation, setLoadingTokenConfirmation] =
    useState(false);
  const [inviterData, setInviterData] = useState<InviterData>();

  const [signUpForm, setsignUpForm] = useState<ISignUpForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [checkedFields, setCheckedFields] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleFieldBlur = (key: string) => () =>
    setCheckedFields((prev) => ({ ...prev, [key]: true }));

  const handlesignUpFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    setsignUpForm({
      ...signUpForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const response = await dispatch(
      signUpUser(fromInvite ? { ...signUpForm, fromInviteId: id } : signUpForm)
    );

    if (response?.data?.access_token) {
      posthog.identify(signUpForm.email, {
        firstName: signUpForm.firstName,
        lastName: signUpForm.lastName,
        laudspeakerId: response.data.id,
        email: signUpForm.email,
      });
      if (!response?.data?.verified) {
        //console.log("oi oi");
        toast.info(
          "You need to verify your email. We've sent you a verification email",
          {
            position: "bottom-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          }
        );
      }
      setShowWelcomeBanner(true);
      navigate("/home");
    }

    if (response.err) {
      let message = "Unexpected error";
      if (response.err instanceof AxiosError)
        message = response.err.response?.data?.message || message;
      toast.error(message);
    }
  };

  const isInvalids = {
    firstName: !signUpForm.firstName.trim(),
    lastName: !signUpForm.lastName.trim(),
    pass:
      !signUpForm.password.trim() ||
      !signUpForm.confirmPassword.trim() ||
      signUpForm.password.trim().length < 8 ||
      signUpForm.confirmPassword.trim().length < 8 ||
      signUpForm.confirmPassword.trim() !== signUpForm.password.trim(),
    mail: !signUpForm.email.match(
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/
    ),
  };

  const isInvalid =
    isInvalids.firstName ||
    isInvalids.lastName ||
    isInvalids.pass ||
    isInvalids.mail;

  const loadData = async () => {
    setLoadingTokenConfirmation(true);
    try {
      const { data } = await ApiService.get({
        url: `/organizations/check-invite-status/${id}`,
      });
      localStorage.removeItem("userData");
      document.cookie = "";
      setInviterData({
        email: data.organization.owner.email,
        firstName: data.organization.owner.firstName,
        lastName: data.organization.owner.lastName,
      });
      setsignUpForm((prev) => ({ ...prev, email: data.email }));
      setLoadingTokenConfirmation(false);
    } catch (error) {
      toast.error("Error validating invite. Moving to main page.");
      navigate("/");
    }
  };

  useEffect(() => {
    if (!fromInvite || !id) return;

    loadData();
  }, [id]);

  if (loadingTokenConfirmation && fromInvite) {
    <div
      className={`flex justify-center items-center w-full h-screen bg-white`}
    >
      <TailSpin
        height="120"
        width="120"
        color="#6366F1"
        ariaLabel="tail-spin-loading"
        radius="5"
        wrapperStyle={{}}
        wrapperClass=""
        visible={true}
      />
    </div>;
  }

  return (
    <div className="flex min-h-screen flex-col justify-center items-center gap-10 bg-[#F3F4F6] font-inter text-[#111827] text-[14px] leading-[22px]">
      <img src={laudspeakerHeader} alt="Laudspeaker" />

      <div
        className="w-[480px] bg-white p-10 rounded-xl flex flex-col items-center gap-5"
        style={{
          boxShadow: "0px 2px 0px 0px rgba(0, 0, 0, 0.03)",
        }}
      >
        {fromInvite ? (
          <div className="text-[#111827] font-roboto text-3xl font-bold break-all">
            Welcome! {inviterData?.firstName} invited you to join their team
          </div>
        ) : (
          <div className="text-[#111827] font-roboto text-3xl font-bold break-all text-center">
            Sign Up
          </div>
        )}
        <form className="flex flex-col gap-5" action="#" method="POST">
          <div className="flex">
            <div className="flex flex-col gap-2.5 mr-[20px]">
              <label
                htmlFor="firstName"
                className="block text-base font-semibold text-[#111827] font-inter"
              >
                First Name
              </label>
              <div>
                <input
                  required
                  value={signUpForm.firstName}
                  placeholder="John"
                  name="firstName"
                  id="firstName"
                  onChange={handlesignUpFormChange}
                  className={`${
                    isInvalids.firstName && checkedFields.firstName
                      ? "border-red-600 text-red-600 focus:border-red-600 focus:ring-red-600"
                      : "focus:border-[#818CF8] focus:ring-[#818CF8]"
                  } block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm  sm:text-sm focus:outline-none`}
                  onBlur={handleFieldBlur("firstName")}
                />
                {isInvalids.firstName && checkedFields.firstName && (
                  <p className="mt-2 text-sm text-red-600">
                    First Name is required
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <label
                htmlFor="lastName"
                className="block text-base font-semibold text-[#111827] font-inter"
              >
                Last Name
              </label>
              <div>
                <input
                  required
                  value={signUpForm.lastName}
                  placeholder="Doe"
                  name="lastName"
                  id="lastName"
                  onChange={handlesignUpFormChange}
                  className={`${
                    isInvalids.lastName && checkedFields.lastName
                      ? "border-red-600 text-red-600 focus:border-red-600 focus:ring-red-600"
                      : "focus:border-[#818CF8] focus:ring-[#818CF8]"
                  } block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm  sm:text-sm focus:outline-none`}
                  onBlur={handleFieldBlur("lastName")}
                />
                {isInvalids.lastName && checkedFields.lastName && (
                  <p className="mt-2 text-sm text-red-600">
                    Last Name is required
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <label
              htmlFor="email"
              className="block text-base font-semibold text-[#111827] font-inter"
            >
              Email address
            </label>
            <div>
              <input
                required
                value={signUpForm.email}
                placeholder="you@example.com"
                name="email"
                disabled={fromInvite}
                id="email"
                onChange={fromInvite ? () => {} : handlesignUpFormChange}
                className={`${
                  isInvalids.mail && checkedFields.email
                    ? "border-red-600 text-red-600 focus:border-red-600 focus:ring-red-600"
                    : "focus:border-[#818CF8] focus:ring-[#818CF8]"
                } disabled:opacity-70 disabled:!bg-[#F3F4F6] disabled:pointer-events-none block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm  sm:text-sm focus:outline-none`}
                onBlur={handleFieldBlur("email")}
              />
              {isInvalids.mail && checkedFields.email && (
                <p className="mt-2 text-sm text-red-600">Email is required</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <label
              htmlFor="password"
              className="block text-base font-semibold text-[#111827] font-inter"
            >
              Password
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={signUpForm.password}
                placeholder="••••••••"
                name="password"
                id="password"
                onChange={handlesignUpFormChange}
                className={`${
                  isInvalids.pass && checkedFields.password
                    ? "border-red-600 text-red-600 focus:border-red-600 focus:ring-red-600"
                    : "focus:border-[#818CF8] focus:ring-[#818CF8]"
                } block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm  sm:text-sm focus:outline-none`}
                onBlur={handleFieldBlur("password")}
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
              htmlFor="confirmPassword"
              className="block text-base font-semibold text-[#111827] font-inter"
            >
              Confirm Password
            </label>
            <div>
              <div className="relative">
                <input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  value={signUpForm.confirmPassword}
                  placeholder="••••••••"
                  name="confirmPassword"
                  id="confirmPassword"
                  onChange={handlesignUpFormChange}
                  className={`${
                    isInvalids.pass && checkedFields.password
                      ? "border-red-600 text-red-600 focus:border-red-600 focus:ring-red-600"
                      : "focus:border-[#818CF8] focus:ring-[#818CF8]"
                  } block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm  sm:text-sm focus:outline-none`}
                  onBlur={handleFieldBlur("password")}
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
              rules={["minLength", "specialChar", "number", "letter", "match"]}
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
              value={signUpForm.password}
              valueAgain={signUpForm.confirmPassword}
              onChange={(isValid) => {}}
            />
          </div>

          <div>
            <Tooltip
              content={isInvalid ? "Fill all fields" : ""}
              placement="bottom"
            >
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex w-full h-[44px] items-center disabled:rounded-[30px] disabled:text-white disabled:bg-[#D1D5DB] disabled:border-[#D1D5DB] justify-center rounded-md border border-transparent bg-[#6366F1] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#818CF8] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                disabled={isInvalid}
              >
                Sign Up
              </button>
            </Tooltip>
          </div>
        </form>

        {!fromInvite && (
          <>
            <div className="w-full">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">
                    Or sign up with
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="relative grayscale">
                  <Tooltip content="coming soon">
                    <a
                      href="#"
                      className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
                    >
                      <span className="sr-only">Sign in with Google</span>
                      <img src={googleIcon} className="max-h-[30px]" />
                    </a>
                  </Tooltip>
                </div>

                <div className="relative grayscale">
                  <Tooltip content="coming soon">
                    <a
                      href="#"
                      className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
                    >
                      <span className="sr-only">Sign in with Gitlab</span>
                      <img src={gitlabIcon} className="max-h-[30px]" />
                    </a>
                  </Tooltip>
                </div>

                <div className="relative grayscale">
                  <Tooltip content="coming soon">
                    <a
                      href="#"
                      className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
                    >
                      <span className="sr-only">Sign in with GitHub</span>
                      <img src={githubIcon} className="max-h-[30px]" />
                    </a>
                  </Tooltip>
                </div>
              </div>
            </div>

            <p>
              Already have an account?
              <Link
                href="/login"
                className="underline font-roboto !text-[14px] leading-[22px] text-[#6366F1] m-[0_5px]"
              >
                Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;
