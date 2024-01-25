import { ChangeEvent, FC, MouseEvent, useState } from "react";
import { useDispatch } from "react-redux";
import { ILoginForm, loginUser } from "../../reducers/auth.reducer";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import laudspeakerLogo from "../../assets/images/laudspeaker.svg";
import CustomLink from "components/Link/Link";
import Tooltip from "components/Elements/Tooltip";
import githubIcon from "../../assets/images/github.svg";
import googleIcon from "../../assets/images/google.svg";
import gitlabIcon from "../../assets/images/gitlab.svg";
import laudspeakerHeader from "../../assets/images/laudspeaker-header.svg";
import { Link } from "react-router-dom";
import Input from "components/Elements/Inputv2";
import ShowPasswordIcon from "assets/icons/ShowPasswordIcon";

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

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const response = await dispatch(loginUser(loginForm));
    if (response?.data?.access_token) {
      posthog.identify(loginForm.email, {
        //laudspeakerId: response.data.id,
        email: loginForm.email,
      });
      posthog.capture("LogInProps", {
        $set: {
          email: loginForm.email,
          //laudspeakerId: response.data.id,
        },
      });

      if (!response?.data?.verified && !localStorage.getItem("dontShowAgain")) {
        setShowWelcomeBanner(true);
      }

      navigate("/");
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
          Login
        </div>
        <form className="w-full flex flex-col gap-5" action="#" method="POST">
          <div className="flex flex-col gap-2.5">
            <label
              htmlFor="email"
              className="block text-[16px] font-semibold leading-[24px]"
            >
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={loginForm.email}
              onChange={(value) => setLoginForm({ ...loginForm, email: value })}
              required
              className="!w-full !py-2 !rounded-sm"
              wrapperClassName="!w-full"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label
              htmlFor="password"
              className="block text-[16px] font-semibold leading-[24px]"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="password"
                value={loginForm.password}
                onChange={(value) =>
                  setLoginForm({ ...loginForm, password: value })
                }
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

            <div className="flex items-center">
              <Link
                to="/reset-password"
                className="font-roboto underline font-medium text-[#6366F1] hover:text-[#818CF8]"
              >
                Forget your password?
              </Link>
            </div>
          </div>
          <div>
            <button
              id="loginIntoAccount"
              type="submit"
              className="h-[44px] flex w-full justify-center items-center rounded border border-transparent bg-[#6366F1] py-[4px] px-[15px] text-sm font-semibold text-white text-[16px] leading-[24px] shadow-sm hover:bg-[#818CF8] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              onClick={handleSubmit}
            >
              Login
            </button>
          </div>
        </form>
        <p className="flex items-center !text-[14px]">
          Don't have an account?
          <CustomLink
            href="/signup"
            className="font-roboto !text-[14px] !leading-[22px] underline text-[#6366F1] m-[0_5px]"
          >
            Sign up
          </CustomLink>
        </p>
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or log in with</span>
          </div>
        </div>

        <div className="flex gap-5 w-full">
          <div className="relative grayscale w-full">
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

          <div className="relative grayscale w-full">
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

          <div className="relative grayscale w-full">
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
  );
};

export default Login;
