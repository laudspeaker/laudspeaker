import { Box, Grid, Paper, FormControl } from "@mui/material";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { GenericButton, Input } from "../../components/Elements";
import { signUpUser, ISignUpForm } from "../../reducers/auth";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import googleIcon from "../../assets/images/google.svg";
import githubIcon from "../../assets/images/github.svg";
import gitlabIcon from "../../assets/images/gitlab.svg";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [signUpForm, setsignUpForm] = useState<ISignUpForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleGoogleSignup = () => {};
  const handleGithubSignup = () => {};
  const handleGitlabSignup = () => {};

  const handlesignUpFormChange = (e: any) => {
    setsignUpForm({
      ...signUpForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit: any = async (e: any) => {
    e.preventDefault();
    const response = await dispatch(signUpUser(signUpForm));
    if (response?.data?.access_token) {
      posthog.capture("SignUpProps", {
        $set: {
          email: signUpForm.email,
          firstName: signUpForm.firstName,
          lastName: signUpForm.lastName,
          laudspeakerId: response.data.id,
        },
      });
      navigate("/dashboard");
    }
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
          // maxHeight: '800px',
          width: "100%",
          margin: "50px 0px",
        }}
      >
        <Box
          component="form"
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
          noValidate
          autoComplete="off"
        >
          <Typography
            variant="h2"
            component="h2"
            sx={{
              textAlign: "center",
            }}
          >
            Get Started
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
            {/* grid for  input */}

            <Grid
              container
              direction={"row"}
              justifyContent={"space-between"}
              alignItems={"center"}
              gap={4}
            >
              <FormControl variant="standard" sx={{ maxWidth: "280px" }}>
                {/* <InputLabel shrink htmlFor="email">Email</InputLabel> */}
                <Input
                  isRequired
                  label="First Name"
                  value={signUpForm.firstName}
                  placeholder={"Enter your first name here"}
                  name="firstName"
                  id="firstName"
                  // fullWidth
                  onChange={handlesignUpFormChange}
                  labelShrink
                  size="small"
                />
              </FormControl>
              <FormControl variant="standard" sx={{ maxWidth: "280px" }}>
                {/* <InputLabel shrink htmlFor="email">Email</InputLabel> */}
                <Input
                  isRequired
                  label="Last Name"
                  value={signUpForm.lastName}
                  placeholder={"Enter your last name here"}
                  name="lastName"
                  id="lastName"
                  onChange={handlesignUpFormChange}
                  labelShrink
                  size="small"
                />
              </FormControl>
            </Grid>

            <FormControl variant="standard">
              {/* <InputLabel shrink htmlFor="email">Email</InputLabel> */}
              <Input
                isRequired
                label="Email"
                value={signUpForm.email}
                placeholder={"Enter your Email here"}
                name="email"
                id="email"
                fullWidth
                onChange={handlesignUpFormChange}
                labelShrink
              />
            </FormControl>
            <FormControl variant="standard">
              <Input
                isRequired
                label="Password"
                type="password"
                value={signUpForm.password}
                placeholder={"Enter your Password"}
                name="password"
                id="password"
                fullWidth
                onChange={handlesignUpFormChange}
                labelShrink
              />
            </FormControl>
            <FormControl variant="standard">
              <Input
                isRequired
                label=" Confirm Password"
                type="password"
                value={signUpForm.confirmPassword}
                placeholder={"Re-enter your Password"}
                name="confirmPassword"
                id="confirmPassword"
                fullWidth
                onChange={handlesignUpFormChange}
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
              Create Account
            </GenericButton>
          </Grid>
          <Typography
            variant="body1"
            sx={{
              marginTop: "24px",
              marginBottom: "34px",
              textAlign: "center",
            }}
          >
            Already have an account?
            <Link
              href="/"
              underline="none"
              color="#4FA198"
              sx={{ margin: "0 10px" }}
            >
              Log in
            </Link>
          </Typography>
          <Typography variant="h4" component="h4" textAlign={"center"}>
            Or Sign up with
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
            <GenericButton
              variant="contained"
              onClick={handleGoogleSignup}
              prefix={<img src={googleIcon} alt="google" />}
              size="small"
            >
              Google
            </GenericButton>
            <GenericButton
              variant="contained"
              onClick={handleGithubSignup}
              size="small"
              prefix={<img src={githubIcon} alt="github" />}
            >
              Github
            </GenericButton>
            <GenericButton
              variant="contained"
              onClick={handleGitlabSignup}
              size="small"
              prefix={<img src={gitlabIcon} alt="gitlab" />}
            >
              Gitlab
            </GenericButton>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default Signup;
