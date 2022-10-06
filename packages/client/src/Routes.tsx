import React, { ReactElement, useLayoutEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import tokenService from "./services/token.service";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Channel from "./pages/Settings/channel";
import FlowBuilder from "pages/FlowBuilder";
import EmailConfig from "pages/EmailConfig";
import EventProvider from "pages/Settings/EventProvider";
import EmailConfiguration from "pages/Settings/EmailConfiguration";
import AdditionalSettings from "pages/Settings/AdditionalSettings";
import Completion from "pages/Settings/completion";
import TriggerCreater from "components/TriggerCreater";
import EmailBuilder from "pages/EmailBuilder";
import { useTypedSelector } from "hooks/useTypeSelector";
import { AuthState } from "reducers/auth";
import SlackBuilder from "pages/SlackBuilder";
import Cor from "pages/Cor";
import FlowTable from "pages/FlowTable/FlowTable";
import TemplateTable from "pages/TemplateTable/TemplateTable";
import PeopleTable from "pages/PeopleTable/PeopleTable";
import Journeys from "pages/Journeys";
import Profile from "pages/Profile";
import FlowViewer from "pages/FlowViewer";
import NetworkCofiguration from "pages/Settings/NetworkConfiguration";
import SlackConfiguration from "pages/Settings/SlackConfiguration";
import { useDispatch } from "react-redux";
import { setSettingData } from "reducers/settings";
import ApiService from "services/api.service";

interface IProtected {
  children: ReactElement;
}

const Protected = ({ children }: IProtected) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  useLayoutEffect(() => {
    const func = async () => {
      const loggedIn = await tokenService.verify();
      setIsLoggedIn(loggedIn);
    };
    func();
  }, []);

  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

interface IOnboarded {
  children: ReactElement;
}

const Onboarded = ({ children }: IOnboarded) => {
  const { userData } = useTypedSelector<AuthState>((state) => state.auth);
  const dispatch = useDispatch();
  const { settings } = useTypedSelector((state) => state.settings);

  if (!userData.onboarded) {
    const func = async () => {
      const { data } = await ApiService.get({ url: "/accounts", options: {} });
      dispatch(
        setSettingData({
          ...settings,
          channel: data.expectedOnboarding.filter(
            (str: string) => !data.currentOnboarding.includes(str)
          ),
        })
      );
    };

    func();

    if (settings.channel?.length > 0)
      return <Navigate to="/settings/network-configuration" replace />;

    return <Navigate to="/settings/channel" replace />;
  }
  return children;
};

const RouteComponent: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <Protected>
              <Onboarded>
                <Dashboard />
              </Onboarded>
            </Protected>
          }
        />
        <Route
          path="/flow"
          element={
            <Protected>
              <Onboarded>
                <FlowTable />
              </Onboarded>
            </Protected>
          }
        />
        <Route
          path="/flow/:name"
          element={
            <Protected>
              <Onboarded>
                <FlowBuilder />
              </Onboarded>
            </Protected>
          }
        />
        <Route
          path="/flow/:name/view"
          element={
            <Protected>
              <Onboarded>
                <FlowViewer />
              </Onboarded>
            </Protected>
          }
        />
        <Route
          path="/people"
          element={
            <Protected>
              <Onboarded>
                <PeopleTable />
              </Onboarded>
            </Protected>
          }
        />
        <Route
          path="/emailconfig"
          element={
            <Protected>
              <EmailConfig />
            </Protected>
          }
        />
        <Route
          path="/settings/profile"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />
        <Route
          path="/settings/channel"
          element={
            <Protected>
              <Channel />
            </Protected>
          }
        />
        <Route
          path="/settings/event-provider"
          element={
            <Protected>
              <EventProvider />
            </Protected>
          }
        />
        <Route
          path="/settings/email-configuration"
          element={
            <Protected>
              <EmailConfiguration />
            </Protected>
          }
        />
        <Route
          path="/settings/slack-configuration"
          element={
            <Protected>
              <SlackConfiguration />
            </Protected>
          }
        />
        <Route
          path="/settings/network-configuration"
          element={
            <Protected>
              <NetworkCofiguration />
            </Protected>
          }
        />
        <Route
          path="/settings/additional-settings"
          element={
            <Protected>
              <AdditionalSettings />
            </Protected>
          }
        />
        <Route
          path="/settings/completion"
          element={
            <Protected>
              <Completion />
            </Protected>
          }
        />
        <Route
          path="/trigger"
          element={
            <Protected>
              <TriggerCreater triggerType="timeWindow" />
            </Protected>
          }
        />
        <Route
          path="/email-builder"
          element={
            <Protected>
              <Onboarded>
                <EmailBuilder />
              </Onboarded>
            </Protected>
          }
        />
        <Route
          path="/slack-builder"
          element={
            <Protected>
              <Onboarded>
                <SlackBuilder />
              </Onboarded>
            </Protected>
          }
        />
        <Route
          path="/templates/email/:name"
          element={
            <Protected>
              <Onboarded>
                <EmailBuilder />
              </Onboarded>
            </Protected>
          }
        />
        <Route
          path="/templates/slack/:name"
          element={
            <Protected>
              <Onboarded>
                <SlackBuilder />
              </Onboarded>
            </Protected>
          }
        />
        <Route
          path="/all-templates"
          element={
            <Protected>
              <Onboarded>
                <TemplateTable />
              </Onboarded>
            </Protected>
          }
        />
        <Route
          path="/slack/cor/:id"
          element={
            <Protected>
              <Cor />
            </Protected>
          }
        />
        <Route
          path="/journeys"
          element={
            <Protected>
              <Onboarded>
                <Journeys />
              </Onboarded>
            </Protected>
          }
        />
        <Route
          path="*"
          element={
            <Protected>
              <Onboarded>
                <Dashboard />
              </Onboarded>
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default RouteComponent;
