import { ApiConfig } from "../../constants";
import React, { useLayoutEffect, useState } from "react";
import ApiService from "services/api.service";
import { FormControl, Grid } from "@mui/material";
import Header from "components/Header";
import Drawer from "components/Drawer";
import { useAppSelector } from "store/hooks";

const SlackConfiguration = () => {
  const { settings } = useAppSelector((state) => state.settings);
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
    <div className="pl-[154px] relative bg-[#E5E5E5] flex flex-col h-[100vh]">
      <div className="flex justify-around m-[72px_50px_72px_50px] gap-[30px]">
        <div className="bg-white rounded-3xl p-[30px] w-full max-w-[930px]">
          <h3 className="flex items-center gap-[10px] text-[25px] font-semibold leading-[40px] mb-[10px]">
            Configure your slack
          </h3>
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
        </div>
      </div>
    </div>
  );
};

export default SlackConfiguration;
