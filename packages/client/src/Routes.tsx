import React, {
  FC,
  ReactElement,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import tokenService from "./services/token.service";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import FlowBuilder from "pages/FlowBuilder";
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
import Database from "pages/Integrations/Database";
import Integrations from "pages/Integrations/Integrations";
import Modal from "components/Elements/Modal";
import ApiService from "services/api.service";
import Account from "types/Account";
import { GenericButton } from "components/Elements";
import Home from "pages/Home";

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

export interface WelcomeBannerProviderProps {
  children: ReactNode;
  hidden: boolean;
  setHidden: (value: boolean) => void;
}

const WelcomeBannerProvider: FC<WelcomeBannerProviderProps> = ({
  children,
  hidden,
  setHidden,
}) => {
  const [firstName, setFirstName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get<Account>({ url: "/accounts" });

      setFirstName(data?.firstName || "");
    })();
  }, []);

  return (
    <>
      {children}
      <Modal isOpen={!hidden} onClose={() => setHidden(true)}>
        <div>
          <h3 className="font-[Inter] font-semibold text-[20px] leading-[38px]">
            Welcome {firstName}
          </h3>
          <p>
            Thank you for trying Laudspeaker. To get started we need to do 3
            things
            <ol className="list-decimal pl-[30px] py-[10px]">
              <li>Set up messaging channels</li>
              <li>Set up event streaming</li>
              <li>Optionally import your customers</li>
            </ol>
            <div>
              <p>
                If you get stuck and need help - join our{" "}
                <span className="underline decoration-dashed">
                  <a
                    href="https://join.slack.com/t/laudspeakerusers/shared_invite/zt-1li25huaq-BljJUA1Zm8dXvbZViAbMwg"
                    target="_blank"
                  >
                    slack group
                  </a>
                </span>
              </p>
            </div>
          </p>
          <div className="flex justify-end items-center gap-[10px] mt-[20px]">
            <GenericButton
              customClasses="grayscale"
              onClick={() => {
                localStorage.setItem("dontShowAgain", "true");
                setHidden(true);
              }}
            >
              I no longer need this
            </GenericButton>
            <GenericButton
              onClick={() => {
                setHidden(true);
                navigate("/onboarding");
              }}
            >
              Next
            </GenericButton>
          </div>
        </div>
      </Modal>
    </>
  );
};

const RouteComponent: React.FC = () => {
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login setShowWelcomeBanner={setShowWelcomeBanner} />}
        />
        <Route
          path="/signup"
          element={<Signup setShowWelcomeBanner={setShowWelcomeBanner} />}
        />
        <Route
          path="/"
          element={
            <Protected>
              <WelcomeBannerProvider
                hidden={!showWelcomeBanner}
                setHidden={(value) => setShowWelcomeBanner(!value)}
              >
                <DrawerLayout>
                  <Home />
                </DrawerLayout>
              </WelcomeBannerProvider>
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
          path="/flow/:id"
          element={
            <Protected>
              <DrawerLayout>
                <FlowBuilder />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/flow/:id/view"
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
          path="/integrations"
          element={
            <Protected>
              <DrawerLayout>
                <Integrations />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/integrations/db"
          element={
            <Protected>
              <DrawerLayout>
                <Database />
              </DrawerLayout>
            </Protected>
          }
        />
        <Route
          path="/integrations/db/:id"
          element={
            <Protected>
              <DrawerLayout>
                <Database />
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
              <WelcomeBannerProvider
                hidden={!showWelcomeBanner}
                setHidden={(value) => setShowWelcomeBanner(!value)}
              >
                <DrawerLayout>
                  <Home />
                </DrawerLayout>
              </WelcomeBannerProvider>
            </Protected>
          }
        />
        <Route
          path="/onboarding"
          element={
            <Protected>
              <WelcomeBannerProvider
                hidden={!showWelcomeBanner}
                setHidden={(value) => setShowWelcomeBanner(!value)}
              >
                <DrawerLayout>
                  <OnboardingBeta />
                </DrawerLayout>
              </WelcomeBannerProvider>
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
