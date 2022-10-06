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
    <Box
      sx={{
        backgroundColor: "#E5E5E5",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        // height: '100vh',
      }}
    >
      <Paper
        sx={{
          borderRadius: "25px",
          maxWidth: "696px",
          padding: "23px 48px",
          maxHeight: "800px",
          width: "100%",
          margin: "100px 0px",
        }}
      >
        <Box component="form" noValidate autoComplete="off">
          <Typography
            variant="h2"
            component="h2"
            sx={{
              textAlign: "center",
            }}
          >
            Welcome Back
          </Typography>
          <Grid
            container
            direction={"column"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            gap={4}
            sx={{
              // height: '100vh',
              marginTop: "66px",
              // backgroundColor: '#FFFFFF',
              // maxWidth: '696px'
            }}
          >
            <FormControl variant="standard">
              {/* <InputLabel shrink htmlFor="email">Email</InputLabel> */}
              <Input
                isRequired
                label="Email"
                value={loginForm.email}
                placeholder={"Enter your Email here"}
                name="email"
                id="email"
                fullWidth
                onChange={handleLoginFormChange}
                labelShrink
              />
            </FormControl>
            <FormControl variant="standard">
              <Input
                isRequired
                label="Password"
                type="password"
                value={loginForm.password}
                placeholder={"Enter your Password"}
                name="password"
                id="password"
                fullWidth
                onChange={handleLoginFormChange}
                labelShrink
              />
            </FormControl>
            <GenericButton
              variant="contained"
              onClick={handleSubmit}
              fullWidth
              sx={{
                maxWidth: "340px",
                "background-image":
                  "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              }}
            >
              Sign In
            </GenericButton>
          </Grid>
        </Box>
        <Box
          sx={{
            "& .MuiTextField-root": { m: 1 },
            "& .MuiButton-root": { m: 1 },
            "& .MuiButton-sizeSmall": {
              background: "#ffff",
              border: "1.4px solid #D2D2D2",
              width: "184px",
              height: "62px",
              padding: "6px 16px",
              color: " #838383",
              fontWeight: "400",
              fontSize: "20px",
            },
            // backgroundColor: '#E5E5E5',
            // maxWidth: '696px'
          }}
        >
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
          <Typography variant="h4" component="h4" textAlign={"center"}>
            Or Log in with
          </Typography>
          <Grid
            container
            direction={"row"}
            justifyContent={"center"}
            sx={{
              paddingTop: "26px",
              paddingBottom: "81px",
            }}
          >
            <GoogleAuth
              clientId="31818866399-n6jktkbmj0o0tt7gbi8i8nosu61nakda.apps.googleusercontent.com"
              onFailure={responseGoogle}
              onSuccess={responseGoogle}
              cookiePolicy={"single_host_origin"}
            >
              <GenericButton
                variant="contained"
                size="small"
                prefix={<img src={googleIcon} alt="google" />}
                onClick={(value) => responseGoogle(value)}
              >
                Google
              </GenericButton>
            </GoogleAuth>

            <GithubAuth
              clientId="e31b28c6064493cf01d5"
              onSuccess={(response: any) => responseGithub(response)}
              onFailure={(value: any) => responseGithub(value)}
              className="removeBtnCss"
              redirectUri=""
            >
              <GenericButton
                variant="contained"
                onClick={(e: any) => e.preventDefault()}
                size="small"
                prefix={<img src={githubIcon} alt="github" />}
              >
                Github
              </GenericButton>
            </GithubAuth>

            <GenericButton
              variant="contained"
              onClick={(e) => handleGitlabLogin(e)}
              size="small"
              prefix={<img src={gitlabIcon} alt="gitlab" />}
            >
              Gitlab
            </GenericButton>

            {/* <GitlabAuth
                            host="http://localhost:3000"
                            application_id="09bb378969b98f0765cd962e9efe9b4693385843f6ba5a6fe32f12b86270812f"
                            redirect_uri="http://localhost:3000/laudspeaker-gitlab"
                            scope="api openid profile email"
                             secret={''}
                        /> */}
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default Home;
