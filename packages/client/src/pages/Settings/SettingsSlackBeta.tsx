import { useState, useLayoutEffect } from "react";
import ApiService from "../../services/api.service";
import { ApiConfig } from "../../constants";

export default function SettingsSlackBeta() {
  const [slackInstallUrl, setSlackInstallUrl] = useState<string>("");

  useLayoutEffect(() => {
    (async () => {
      const { data } = await ApiService.get({
        url: `${ApiConfig.slackInstall}`,
      });
      setSlackInstallUrl(data);
    })();
  }, []);

  return (
    <>
      <div className="mt-10 divide-y divide-gray-200">
        <div className="space-y-5">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Laudspeaker Slack App
          </h3>
          <p className="max-w-2xl text-sm text-gray-500">
            Install the Laudspeaker Slack App to start sending automated Slack
            messages to your customers!
          </p>
          <a href={slackInstallUrl} target="_blank" rel="noreferrer noopener">
            <img
              alt="add to slack"
              src="https://platform.slack-edge.com/img/add_to_slack.png"
              srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
              width="139"
              height="40"
            />
          </a>
        </div>
      </div>
    </>
  );
}
