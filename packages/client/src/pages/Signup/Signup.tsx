import React, { ChangeEvent, FC, MouseEvent, useState } from "react";
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

export interface SignupProps {
  setShowWelcomeBanner: (value: boolean) => void;
}

const Signup: FC<SignupProps> = ({ setShowWelcomeBanner }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

    const response = await dispatch(signUpUser(signUpForm));

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
      signUpForm.password.trim().length <= 8 ||
      signUpForm.confirmPassword.trim().length <= 8 ||
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

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src={laudspeakerLogo}
          alt="Laudspeaker"
        />
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Get Started
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full shadow-lg sm:max-w-md">
        <div className="bg-white py-8 px-4 sm:rounded-lg sm:px-10">
          <form className="space-y-6" action="#" method="POST">
            <div className="flex">
              <div className="mr-[20px]">
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <div className="mt-1">
                  <input
                    required
                    value={signUpForm.firstName}
                    placeholder={"Enter your first name here"}
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
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <div className="mt-1">
                  <input
                    required
                    value={signUpForm.lastName}
                    placeholder="Enter your last name here"
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
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1">
                <input
                  required
                  value={signUpForm.email}
                  placeholder="Enter your Email here"
                  name="email"
                  id="email"
                  onChange={handlesignUpFormChange}
                  className={`${
                    isInvalids.mail && checkedFields.email
                      ? "border-red-600 text-red-600 focus:border-red-600 focus:ring-red-600"
                      : "focus:border-[#818CF8] focus:ring-[#818CF8]"
                  } block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm  sm:text-sm focus:outline-none`}
                  onBlur={handleFieldBlur("email")}
                />
                {isInvalids.mail && checkedFields.email && (
                  <p className="mt-2 text-sm text-red-600">Email is required</p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  required
                  type="password"
                  value={signUpForm.password}
                  placeholder={"Enter your Password"}
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
              </div>
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  required
                  type="password"
                  value={signUpForm.confirmPassword}
                  placeholder="Re-enter your Password"
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
                {isInvalids.pass && checkedFields.password && (
                  <p className="mt-2 text-sm text-red-600">
                    Password should be longer than 8 characters and passwords
                    should be equal.
                  </p>
                )}
              </div>
            </div>

            <div>
              <Tooltip
                content={isInvalid ? "Fill all fields" : ""}
                placement="bottom"
              >
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="flex w-full disabled:bg-gray-400 disabled:border-gray-400 disabled:text-gray-600 justify-center rounded-md border border-transparent bg-[#6366F1] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#818CF8] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  disabled={isInvalid}
                >
                  Create Account
                </button>
              </Tooltip>
            </div>
          </form>

          <p className="mt-[24px] mb-[34px] text-center">
            Already have an account?
            <Link
              href="/login"
              className="no-underline text-[#6366F1] m-[0_10px]"
            >
              Log in
            </Link>
          </p>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
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
        </div>
      </div>
    </div>
  );
};

export default Signup;
