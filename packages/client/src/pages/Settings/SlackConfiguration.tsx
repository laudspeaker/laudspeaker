import { ApiConfig } from "../../constants";
import { useTypedSelector } from "hooks/useTypeSelector";
import React, { useLayoutEffect, useState } from "react";
import ApiService from "services/api.service";
import { Box, Card, FormControl, Grid, Typography } from "@mui/material";
import Header from "components/Header";
import Drawer from "components/Drawer";

const SlackConfiguration = () => {
  const { settings } = useTypedSelector((state) => state.settings);
  const [slackInstallUrl, setSlackInstallUrl] = useState<string>("");

  useLayoutEffect(() => {
    const func = async () => {
      const { data } = await ApiService.get({
        url: `${ApiConfig.slackInstall}`,
      });
      setSlackInstallUrl(data);
    };
    func();
  }, []);

  return (
    <Box
      sx={{
        paddingLeft: "154px",
        position: "relative",
        backgroundColor: "#E5E5E5",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        "& .MuiTypography-root": {
          fontFamily: "Inter",
        },
        "& .MuiInputBase-input": {
          background: "#fff",
          border: "1px solid #D1D5DB",
          fontFamily: "Inter",
          fontWeight: 400,
          fontSize: "16px",
          padding: "12px 16px",
          "&:disabled": {
            background: "#EEE !important",
          },
        },
        "& .MuiInputLabel-root": {
          fontSize: "16px",
          fontFamily: "Inter",
        },
        "& .MuiFormControl-root": {
          maxWidth: "529px",
        },
      }}
    >
      <Header />
      <Drawer />
      <Box
        justifyContent={"space-around"}
        display={"flex"}
        margin={"72px 50px 72px 50px"}
        gap={"30px"}
      >
        <Card
          sx={{
            padding: "30px",
            width: "100%",
            maxWidth: "930px",
          }}
        >
          <Typography
            variant="h3"
            display={"flex"}
            alignItems="center"
            gap="10px"
            sx={{
              fontSize: "25px",
              fontWeight: 600,
              lineHeight: "40px",
              marginBottom: "10px",
            }}
          >
            Configure your slack
          </Typography>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <div>
                {settings.channel == "Slack" && (
                  <a
                    href={slackInstallUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <img
                      alt="add to slack"
                      src="https://platform.slack-edge.com/img/add_to_slack.png"
                      srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                      width="139"
                      height="40"
                    />
                  </a>
                )}
              </div>
            </FormControl>
          </Grid>
        </Card>
      </Box>
    </Box>
  );
};

export default SlackConfiguration;
