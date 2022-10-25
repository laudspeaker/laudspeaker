import React, {
  ReactElement,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import tokenService from "./services/token.service";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Channel from "pages/Settings/Channel";
import FlowBuilder from "pages/FlowBuilder";
import EmailConfig from "pages/EmailConfig";
import EmailProvider from "pages/Settings/EmailProvider";
import MailgunConfiguration from "pages/Settings/MailgunConfiguration";
import PosthogConfiguration from "pages/Settings/PosthogConfiguration";
import PosthogConfigurationTwo from "pages/Settings/PosthogConfigurationTwo";
import PosthogConfigurationThree from "pages/Settings/PosthogConfigurationThree";
import Completion from "pages/Settings/Completion";
import TriggerCreater from "components/TriggerCreater";
import EmailBuilder from "pages/EmailBuilder";
import { useTypedSelector } from "hooks/useTypeSelector";
import { ActionType, AuthState, getUserPermissions } from "reducers/auth";
import SlackBuilder from "pages/SlackBuilder";
import Cor from "pages/Cor";
import FlowTable from "pages/FlowTable/FlowTable";
import TemplateTable from "pages/TemplateTable/TemplateTable";
import PeopleTable from "pages/PeopleTable/PeopleTable";
import Profile from "pages/Profile";
import FlowViewer from "pages/FlowViewer";
import NetworkCofiguration from "pages/Settings/NetworkConfiguration";
import SlackConfiguration from "pages/Settings/SlackConfiguration";
import { useDispatch } from "react-redux";
import { setSettingData } from "reducers/settings";
import ApiService from "services/api.service";
import EventsProvider from "pages/Settings/EventsProvider";
import DrawerLayout from "components/DrawerLayout";
import Integrations from "pages/Settings/Integrations";
import MailgunConfigurationTwo from "pages/Settings/MailgunConfigurationTwo";
import SettingsGeneralBeta from "pages/Settings/SettingsGeneralBeta";
import SettingsAPIBeta from "pages/Settings/SettingsAPIBeta";
import SettingsEmailBeta from "pages/Settings/SettingsEmailBeta";
import SettingsSMSBeta from "pages/Settings/SettingsSMSBeta";
import SettingsSlackBeta from "pages/Settings/SettingsSlackBeta";
import SettingsEventsBeta from "pages/Settings/SettingsEventsBeta";
import SettingsPlanBeta from "pages/Settings/SettingsPlanBeta";
import SettingsBillingBeta from "pages/Settings/SettingsBillingBeta";
import SettingsTeamBeta from "pages/Settings/SettingsTeamBeta";
import TableBeta from "pages/TemplateTable/TableBeta";
import OnboardingBeta from "pages/Onboarding/OnboardingBeta";

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

  const dispatch = useDispatch();
  if (isLoggedIn) {
    dispatch(getUserPermissions());
  }

  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

interface IOnboarded {
  children: ReactElement;
}

const Onboarded = ({ children }: IOnboarded) => {
  const { userData } = useTypedSelector<AuthState>((state) => state.auth);
  const dispatch = useDispatch();
  const { settings } = useTypedSelector((state) => state.settings);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData.onboarded) {
      const func = async () => {
        let data: any;
        try {
          data = (
            await ApiService.get({
              url: "/accounts",
              options: {},
            })
          ).data;
        } catch (e) {
          return;
        }

        dispatch({
          type: ActionType.UPDATE_USER_INFO,
          payload: {
            ...userData,
            onboarded: data.onboarded,
            expectedOnboarding: data.expectedOnboarding,
          },
        });
        dispatch(
          setSettingData({
            ...settings,
            channel: data.expectedOnboarding.filter(
              (str: string) => !data.currentOnboarding.includes(str)
            ),
          })
        );
        if (settings.channel?.length > 0) {
          navigate("/settings/network-configuration");
          return;
        }
        navigate("/settings/channel");
      };

      func();
    }
  }, []);

  return userData.onboarded ? children : <></>;
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
              <DrawerLayout>
                <FlowTable />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/flow"
          element={
            <Protected>
              <DrawerLayout>
                <FlowTable />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/flow/:name"
          element={
            <Protected>
              <DrawerLayout>
                <FlowBuilder />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/flow/:name/view"
          element={
            <Protected>
              <DrawerLayout>
                <FlowViewer />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/people"
          element={
            <Protected>
              <DrawerLayout>
                <PeopleTable />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/emailconfig"
          element={
            <Protected>
              <DrawerLayout>
                <EmailConfig />
              </DrawerLayout>
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
              <DrawerLayout>
                <EmailBuilder />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/slack-builder"
          element={
            <Protected>
              <DrawerLayout>
                <SlackBuilder />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/templates/email/:name"
          element={
            <Protected>
              <DrawerLayout>
                <EmailBuilder />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/templates/slack/:name"
          element={
            <Protected>
              <DrawerLayout>
                <SlackBuilder />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/templates"
          element={
            <Protected>
              <DrawerLayout>
                <TemplateTable />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected>
              <DrawerLayout>
                <SettingsGeneralBeta />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/settings/api"
          element={
            <Protected>
              <DrawerLayout>
                <SettingsAPIBeta />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/settings/email"
          element={
            <Protected>
              <DrawerLayout>
                <SettingsEmailBeta />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/settings/slack"
          element={
            <Protected>
              <DrawerLayout>
                <SettingsSlackBeta />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/settings/events"
          element={
            <Protected>
              <DrawerLayout>
                <SettingsEventsBeta />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/settings/sms"
          element={
            <Protected>
              <DrawerLayout>
                <SettingsSMSBeta />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/settings/plan"
          element={
            <Protected>
              <DrawerLayout>
                <SettingsPlanBeta />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/settings/billing"
          element={
            <Protected>
              <DrawerLayout>
                <SettingsBillingBeta />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/settings/team"
          element={
            <Protected>
              <DrawerLayout>
                <SettingsTeamBeta />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/beta/table"
          element={
            <Protected>
              <DrawerLayout>
                <TableBeta />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/home"
          element={
            <Protected>
              <DrawerLayout>
                <OnboardingBeta />
              </DrawerLayout>
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
        {/* 
        TEMP: uncomment in future
        <Route
          path="/journeys"
          element={
            <Protected>
              <Onboarded>
                <Journeys />
              </Onboarded>
            </Protected>
          }
        /> */}
        <Route
          path="*"
          element={
            <Protected>
              <DrawerLayout>
                <FlowTable />
              </DrawerLayout>
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default RouteComponent;
