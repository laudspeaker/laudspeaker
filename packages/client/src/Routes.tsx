import React, { ReactElement, useLayoutEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import tokenService from "./services/token.service";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import FlowBuilder from "pages/FlowBuilder";
import EmailConfig from "pages/EmailConfig";
import TriggerCreater from "components/TriggerCreater";
import EmailBuilder from "pages/EmailBuilder";
import { getUserPermissions } from "reducers/auth";
import SlackBuilder from "pages/SlackBuilder";
import Cor from "pages/Cor";
import FlowTable from "pages/FlowTable/FlowTable";
import TemplateTable from "pages/TemplateTable/TemplateTable";
import PeopleTable from "pages/PeopleTable/PeopleTable";
import FlowViewer from "pages/FlowViewer";
import { useDispatch } from "react-redux";
import DrawerLayout from "components/DrawerLayout";
import TableBeta from "pages/TemplateTable/TableBeta";
import OnboardingBeta from "pages/Onboarding/OnboardingBeta";
import Settings from "pages/Settings/Settings";
import Person from "pages/Person";
import Verify from "pages/Verify";
import SmsBuilder from "pages/SmsBuilder";
import { TriggerTypeName } from "types/Workflow";

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
          path="/sms-builder"
          element={
            <Protected>
              <DrawerLayout>
                <SmsBuilder />
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
          path="/templates/sms/:name"
          element={
            <Protected>
              <DrawerLayout>
                <SmsBuilder />
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
