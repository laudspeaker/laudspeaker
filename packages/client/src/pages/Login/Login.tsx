import { ChangeEvent, FC, MouseEvent, useState } from "react";
import { useDispatch } from "react-redux";
import { ILoginForm, loginUser } from "../../reducers/auth";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import laudspeakerLogo from "../../assets/images/laudspeaker.svg";
import CustomLink from "components/Link/Link";
import Tooltip from "components/Elements/Tooltip";
import githubIcon from "../../assets/images/github.svg";
import googleIcon from "../../assets/images/google.svg";
import gitlabIcon from "../../assets/images/gitlab.svg";
import { Link } from "react-router-dom";

export interface LoginProps {
  setShowWelcomeBanner: (value: boolean) => void;
}

const Login: FC<LoginProps> = ({ setShowWelcomeBanner }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loginForm, setLoginForm] = useState<ILoginForm>({
    email: "",
    password: "",
  });

  const handleLoginFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const response = await dispatch(loginUser(loginForm));
    if (response?.data?.access_token) {
      posthog.identify( loginForm.email, {
        laudspeakerId: response.data.id,
        email: loginForm.email,
      });
      posthog.capture("LogInProps", {
        $set: {
          email: loginForm.email,
          laudspeakerId: response.data.id,
        },
      });

      if (!response?.data?.verified && !localStorage.getItem("dontShowAgain")) {
        setShowWelcomeBanner(true);
      }

      navigate("/");
    }
  };

  return (
    <>
      <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-12 w-auto"
            src={laudspeakerLogo}
            alt="Laudspeaker"
          />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full shadow-lg sm:max-w-md">
          <div className="bg-white py-8 px-4 sm:rounded-lg sm:px-10">
            <form className="space-y-6" action="#" method="POST">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    onChange={handleLoginFormChange}
                    value={loginForm.email}
                    required
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
                  />
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
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    onChange={handleLoginFormChange}
                    value={loginForm.password}
                    required
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="text-sm flex items-center justify-end">
                <Link
                  to="/reset-password"
                  className="font-medium text-cyan-600 hover:text-cyan-500"
                >
                  Forgot your password?
                </Link>
              </div>
              <div>
                <button
                  id="loginIntoAccount"
                  type="submit"
                  className="flex w-full justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  onClick={handleSubmit}
                >
                  Sign in
                </button>
              </div>
            </form>
            <p className="pt-[24px] mb-[34px] text-center">
              Want to create an account?
              <CustomLink
                href="/signup"
                className="no-underline text-[#4FA198] m-[0_10px]"
              >
                Sign Up
              </CustomLink>
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
    </>
  );
};

export default Login;
