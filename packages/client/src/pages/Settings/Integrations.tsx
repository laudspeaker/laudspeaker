import Header from "components/Header";
import React, { useEffect, useState } from "react";
import ApiService from "services/api.service";
import Input from "../../components/Elements/Input";
import Select from "../../components/Elements/Select";
import { allChannels } from "./EventsProv";

interface IntegrationsData {
  sendingName: string;
  sendingEmail: string;
  slackId: string;
  eventProvider: string;
}

const Integrations = () => {
  const [integrationsData, setIntegrationsData] = useState<IntegrationsData>({
    sendingName: "",
    sendingEmail: "",
    slackId: "",
    eventProvider: "posthog",
  });
  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/accounts" });
      const { sendingName, sendingEmail, slackTeamId } = data;
      setIntegrationsData({
        ...integrationsData,
        sendingName,
        sendingEmail,
        slackId: slackTeamId?.[0],
      });
    })();
  }, []);

  const handleIntegrationsDataChange = (e: any) => {
    setIntegrationsData({
      ...integrationsData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <div className="flex-col">
        <Header />
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1 p-5">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Email
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                This information will be displayed publicly so be careful what
                you share.
              </p>
            </div>
          </div>
          <div className="mt-5 md:col-span-2 pd-5">
            <form action="#" method="POST">
              <div className="shadow sm:overflow-hidden sm:rounded-md">
                <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                  <h2>Email configuration</h2>
                  <Input
                    name="sendingName"
                    id="sendingName"
                    label="Sending name"
                    value={integrationsData.sendingName}
                    className="border-black border-[1px]"
                    onChange={handleIntegrationsDataChange}
                  />
                  <Input
                    name="sendingEmail"
                    id="sendingEmail"
                    label="Sending email"
                    value={integrationsData.sendingEmail}
                    className="border-black border-[1px]"
                    onChange={handleIntegrationsDataChange}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
        <div className="md:grid md:grid-cols-3 md:gap-6 border-t-[1px]">
          <div className="md:col-span-1 p-5">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Slack
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                This information will be displayed publicly so be careful what
                you share.
              </p>
            </div>
          </div>
          <div className="mt-5 md:col-span-2 pd-5">
            <form action="#" method="POST">
              <div className="shadow sm:overflow-hidden sm:rounded-md">
                <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                  <h2>Slack configuration</h2>
                  <Input
                    name="slackId"
                    id="slackId"
                    type="email"
                    label="Sending name"
                    value={integrationsData.slackId}
                    className="border-black border-[1px]"
                    onChange={handleIntegrationsDataChange}
                    disabled
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
        <div className="md:grid md:grid-cols-3 md:gap-6 border-t-[1px]">
          <div className="md:col-span-1 p-5">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Events
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                This information will be displayed publicly so be careful what
                you share.
              </p>
            </div>
          </div>
          <div className="mt-5 md:col-span-2 pd-5">
            <form action="#" method="POST">
              <div className="shadow sm:rounded-md">
                <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                  <h2>Events configuration</h2>
                  <Select
                    id="events_config_select"
                    options={allChannels.map((item: any) => ({
                      value: item.id,
                      title: item.title,
                      disabled: item.disabled,
                    }))}
                    value={integrationsData.eventProvider}
                    onChange={(value: string) =>
                      setIntegrationsData({
                        ...integrationsData,
                        eventProvider: value,
                      })
                    }
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Integrations;
