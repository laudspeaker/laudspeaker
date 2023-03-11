/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";
import setFree3 from "../test-helpers/setFree3";
import setSendgrid from "../test-helpers/setSendgrid";
import setSMS from "../test-helpers/setSMS";
import { templatesFunc } from "../test-helpers/templatesFunc";
import testPauseStop, {
  PauseStopTestType,
} from "../test-helpers/testPauseStop";
import verifyAccount from "../test-helpers/verifyAccount";

const {
  email,
  password,
  slackTemplate,
  userAPIkey,
  emailTemplate,
  smsTemplate,
} = credentials.MessageHitUser;

const { TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL } = Cypress.env();

describe(
  "Pause and stop",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(5000);
      cy.reload();
      Cypress.on("uncaught:exception", () => {
        return false;
      });
    });

    it("passes for mailgun", () => {
      loginFunc(email, password);
      templatesFunc(slackTemplate, emailTemplate);
      verifyAccount();
      testPauseStop();
    });

    it("passes for free3", () => {
      loginFunc(email, password);
      templatesFunc(slackTemplate, emailTemplate);
      setFree3();
      cy.contains("Messaging").click();

      testPauseStop(PauseStopTestType.email, true);
    });

    it("passes for sendgrid", () => {
      loginFunc(email, password);
      verifyAccount();
      templatesFunc(slackTemplate, emailTemplate);
      setSendgrid(TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL);

      cy.contains("Messaging").click();
      testPauseStop(PauseStopTestType.email, true);
    });

    it("passes for sms", () => {
      loginFunc(email, password);
      verifyAccount();
      templatesFunc(slackTemplate, emailTemplate, smsTemplate);
      setSMS();
      cy.contains("Messaging").click();
      testPauseStop(PauseStopTestType.sms, true);
    });
  }
);
