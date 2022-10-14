import { Box, Grid, Paper, FormControl } from "@mui/material";
import React, { useState } from "react";
import GoogleAuth from "../../components/Auth/GoogleAuth";
import GithubAuth from "../../components/Auth/GithubAuth";
import { useDispatch } from "react-redux";
import { GenericButton, Input } from "../../components/Elements";
import { ILoginForm, loginUser } from "../../reducers/auth";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import googleIcon from "../../assets/images/google.svg";
import githubIcon from "../../assets/images/github.svg";
import gitlabIcon from "../../assets/images/gitlab.svg";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import laudspeakerLogo from "../../assets/images/laudspeaker.svg";

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loginForm, setLoginForm] = useState<ILoginForm>({
    email: "",
    password: "",
  });

  const handleGitlabLogin = (_: any) => {
    return _;
  };

  const handleLoginFormChange = (e: any) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit: any = async (e: any) => {
    e.preventDefault();
    const response = await dispatch(loginUser(loginForm));
    if (response?.data?.access_token) {
      posthog.capture("LogInProps", {
        $set: {
          email: loginForm.email,
          laudspeakerId: response.data.id,
        },
      });

      navigate("/dashboard");
    }
  };
  const responseGoogle = (_: any) => {
    return _;
  };

  const responseGithub = (_: any) => {
    return _;
  };

  return (
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-gray-50">
        <body class="h-full">
        ```
      */}
      <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-12 w-auto"
            src={laudspeakerLogo}
            alt="Your Company"
          />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={handleSubmit}
                >
                  Sign in
                </button>
              </div>
            </form>
            <Typography
              variant="body1"
              sx={{
                marginTop: "24px",
                marginBottom: "34px",
                textAlign: "center",
              }}
            >
              Want to create an account?
              <Link
                href="/signup"
                underline="none"
                color="#4FA198"
                sx={{ margin: "0 10px" }}
              >
                Sign Up
              </Link>
            </Typography>
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
                <div>
                  <a
                    href="#"
                    className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
                  >
                    <span className="sr-only">Sign in with Facebook</span>
                    <svg
                      className="h-5 w-5"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </div>

                <div>
                  <a
                    href="#"
                    className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
                  >
                    <span className="sr-only">Sign in with Twitter</span>
                    <svg
                      className="h-5 w-5"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                </div>

                <div>
                  <a
                    href="#"
                    className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
                  >
                    <span className="sr-only">Sign in with GitHub</span>
                    <svg
                      className="h-5 w-5"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
    // <Box
    //   sx={{
    //     backgroundColor: "#E5E5E5",
    //     display: "flex",
    //     justifyContent: "center",
    //     alignItems: "center",
    //     // height: '100vh',
    //   }}
    // >
    //   <Paper
    //     sx={{
    //       borderRadius: "25px",
    //       maxWidth: "696px",
    //       padding: "23px 48px",
    //       maxHeight: "800px",
    //       width: "100%",
    //       margin: "100px 0px",
    //     }}
    //   >
    //     <Box component="form" noValidate autoComplete="off">
    //       <Typography
    //         variant="h2"
    //         component="h2"
    //         sx={{
    //           textAlign: "center",
    //         }}
    //       >
    //         Welcome Back
    //       </Typography>
    //       <Grid
    //         container
    //         direction={"column"}
    //         justifyContent={"flex-start"}
    //         alignItems={"center"}
    //         gap={4}
    //         sx={{
    //           // height: '100vh',
    //           marginTop: "66px",
    //           // backgroundColor: '#FFFFFF',
    //           // maxWidth: '696px'
    //         }}
    //       >
    //         <FormControl variant="standard">
    //           {/* <InputLabel shrink htmlFor="email">Email</InputLabel> */}
    //           <Input
    //             isRequired
    //             label="Email"
    //             value={loginForm.email}
    //             placeholder={"Enter your Email here"}
    //             name="email"
    //             id="email"
    //             fullWidth
    //             onChange={handleLoginFormChange}
    //             labelShrink
    //           />
    //         </FormControl>
    //         <FormControl variant="standard">
    //           <Input
    //             isRequired
    //             label="Password"
    //             type="password"
    //             value={loginForm.password}
    //             placeholder={"Enter your Password"}
    //             name="password"
    //             id="password"
    //             fullWidth
    //             onChange={handleLoginFormChange}
    //             labelShrink
    //           />
    //         </FormControl>
    //         <GenericButton
    //           variant="contained"
    //           onClick={handleSubmit}
    //           fullWidth
    //           sx={{
    //             maxWidth: "340px",
    //             "background-image":
    //               "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
    //           }}
    //         >
    //           Sign In
    //         </GenericButton>
    //       </Grid>
    //     </Box>
    //     <Box
    //       sx={{
    //         "& .MuiTextField-root": { m: 1 },
    //         "& .MuiButton-root": { m: 1 },
    //         "& .MuiButton-sizeSmall": {
    //           background: "#ffff",
    //           border: "1.4px solid #D2D2D2",
    //           width: "184px",
    //           height: "62px",
    //           padding: "6px 16px",
    //           color: " #838383",
    //           fontWeight: "400",
    //           fontSize: "20px",
    //         },
    //         // backgroundColor: '#E5E5E5',
    //         // maxWidth: '696px'
    //       }}
    //     >
    //       <Typography
    //         variant="body1"
    //         sx={{
    //           marginTop: "24px",
    //           marginBottom: "34px",
    //           textAlign: "center",
    //         }}
    //       >
    //         Want to create an account?
    //         <Link
    //           href="/signup"
    //           underline="none"
    //           color="#4FA198"
    //           sx={{ margin: "0 10px" }}
    //         >
    //           Sign Up
    //         </Link>
    //       </Typography>
    //       <Typography variant="h4" component="h4" textAlign={"center"}>
    //         Or Log in with
    //       </Typography>
    //       <Grid
    //         container
    //         direction={"row"}
    //         justifyContent={"center"}
    //         sx={{
    //           paddingTop: "26px",
    //           paddingBottom: "81px",
    //         }}
    //       >
    //         <GoogleAuth
    //           clientId="31818866399-n6jktkbmj0o0tt7gbi8i8nosu61nakda.apps.googleusercontent.com"
    //           onFailure={responseGoogle}
    //           onSuccess={responseGoogle}
    //           cookiePolicy={"single_host_origin"}
    //         >
    //           <GenericButton
    //             variant="contained"
    //             size="small"
    //             prefix={<img src={googleIcon} alt="google" />}
    //             onClick={(value) => responseGoogle(value)}
    //           >
    //             Google
    //           </GenericButton>
    //         </GoogleAuth>

    //         <GithubAuth
    //           clientId="e31b28c6064493cf01d5"
    //           onSuccess={(response: any) => responseGithub(response)}
    //           onFailure={(value: any) => responseGithub(value)}
    //           className="removeBtnCss"
    //           redirectUri=""
    //         >
    //           <GenericButton
    //             variant="contained"
    //             onClick={(e: any) => e.preventDefault()}
    //             size="small"
    //             prefix={<img src={githubIcon} alt="github" />}
    //           >
    //             Github
    //           </GenericButton>
    //         </GithubAuth>

    //         <GenericButton
    //           variant="contained"
    //           onClick={(e) => handleGitlabLogin(e)}
    //           size="small"
    //           prefix={<img src={gitlabIcon} alt="gitlab" />}
    //         >
    //           Gitlab
    //         </GenericButton>

    //         {/* <GitlabAuth
    //                         host="http://localhost:3000"
    //                         application_id="09bb378969b98f0765cd962e9efe9b4693385843f6ba5a6fe32f12b86270812f"
    //                         redirect_uri="http://localhost:3000/laudspeaker-gitlab"
    //                         scope="api openid profile email"
    //                          secret={''}
    //                     /> */}
    //       </Grid>
    //     </Box>
    //   </Paper>
    // </Box>
  );
};

export default Home;
