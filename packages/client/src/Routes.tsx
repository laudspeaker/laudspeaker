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
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import FlowBuilder from "pages/FlowBuilder";
import EmailConfig from "pages/EmailConfig";
import TriggerCreater from "components/TriggerCreater";
import EmailBuilder from "pages/EmailBuilder";
import { useTypedSelector } from "hooks/useTypeSelector";
import { ActionType, AuthState, getUserPermissions } from "reducers/auth";
import SlackBuilder from "pages/SlackBuilder";
import Cor from "pages/Cor";
import FlowTable from "pages/FlowTable/FlowTable";
import TemplateTable from "pages/TemplateTable/TemplateTable";
import PeopleTable from "pages/PeopleTable/PeopleTable";
import FlowViewer from "pages/FlowViewer";
import { useDispatch } from "react-redux";
import { setSettingData } from "reducers/settings";
import ApiService from "services/api.service";
import DrawerLayout from "components/DrawerLayout";
import TableBeta from "pages/TemplateTable/TableBeta";
import OnboardingBeta from "pages/Onboarding/OnboardingBeta";
import Settings from "pages/Settings/Settings";
import Person from "pages/Person";
import Verify from "pages/Verify";
import DatabaseTable from "pages/DatabaseTable/DatabaseTable";

interface IProtected {
  children: ReactElement;
}

const Protected = ({ children }: IProtected) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  useLayoutEffect(() => {
    const func = async () => {
      const loggedIn = await tokenService.verify();
      if (!loggedIn) navigate("/login");
      setIsLoggedIn(loggedIn);
    };
    func();
  }, []);

  const dispatch = useDispatch();
  if (isLoggedIn) {
    dispatch(getUserPermissions());
  }

  return isLoggedIn ? children : <></>;
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
          path="/verify-email/:id"
          element={
            <Protected>
              <DrawerLayout>
                <Verify />
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
          path="/person/:id"
          element={
            <Protected>
              <DrawerLayout>
                <Person />
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
                <Settings />
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
        <Route
          path="/integrations"
          element={
            <Protected>
              <DrawerLayout>
                <DatabaseTable />
              </DrawerLayout>
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
