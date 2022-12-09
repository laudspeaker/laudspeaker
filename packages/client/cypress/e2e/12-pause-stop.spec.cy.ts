/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials.json";
import { loginFunc } from "../test-helpers/loginFunc";
import setFree3 from "../test-helpers/setFree3";
import setSendgrid from "../test-helpers/setSendgrid";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { tamplatesFunc } from "../test-helpers/templatesFunc";
import testPauseStop from "../test-helpers/testPauseStop";

const { email, password, slackTemplate, userAPIkey, emailTemplate } =
  credentials.MessageHitUser;

const resizeObserverLoopErrRegExp = /^ResizeObserver loop limit exceeded/;
const { TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL } = Cypress.env();

describe(
  "Pause and stop",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
      Cypress.on("uncaught:exception", () => {
        return false;
      });
    });

    it("passes for mailgun", () => {
      loginFunc(email, password);
      tamplatesFunc(slackTemplate, emailTemplate);

      testPauseStop();
    });

    it("passes for free3", () => {
      loginFunc(email, password);
      tamplatesFunc(slackTemplate, emailTemplate);
      setFree3();
      cy.contains("Messaging").click();

      testPauseStop();
    });

    it("passes for sendgrid", () => {
      loginFunc(email, password);
      tamplatesFunc(slackTemplate, emailTemplate);
      setSendgrid(TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL);
      cy.contains("Messaging").click();

      testPauseStop();
    });
  }
);
