/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";
import setFree3 from "../test-helpers/setFree3";
import setSendgrid from "../test-helpers/setSendgrid";
import setSMS from "../test-helpers/setSMS";
import { templatesFunc } from "../test-helpers/templatesFunc";
import testSpecificTimeTrigger from "../test-helpers/testSpecificTimeTrigger";
import verifyAccount from "../test-helpers/verifyAccount";

const { email, password, emailTemplate, slackTemplate, smsTemplate } =
  credentials.MessageHitUser;

const { TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL } = Cypress.env();

describe(
  "Journey with email and two step delay triggered",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
    });

    it("passes for free 3 emails", () => {
      loginFunc(email, password);
      templatesFunc();
      setFree3();
      cy.contains("Messaging").click();

      testSpecificTimeTrigger();
    });

    it("passes for mailgun", () => {
      loginFunc(email, password);
      templatesFunc(slackTemplate, emailTemplate);
      verifyAccount();
      testSpecificTimeTrigger();
    });

    it("passes for sendgrid", () => {
      loginFunc(email, password);
      verifyAccount();
      templatesFunc(slackTemplate, emailTemplate);
      setSendgrid(TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL);

      cy.contains("Messaging").click();
      testSpecificTimeTrigger();
    });

    it("passes for slack", () => {
      loginFunc(email, password);
      verifyAccount();
      templatesFunc(slackTemplate, emailTemplate);

      testSpecificTimeTrigger("13141414", "124we1414", () => {
        cy.get("#slack").click();

        cy.get("#activeJourney").click();
        cy.contains(slackTemplate.name).click();
        cy.get("#exportSelectedTemplate").click();
      });
    });

    it("passes for sms", () => {
      loginFunc(email, password);
      verifyAccount();
      templatesFunc(slackTemplate, emailTemplate, smsTemplate);
      setSMS();
      cy.contains("Messaging").click();
      testSpecificTimeTrigger("13141414", "124we1414", () => {
        cy.get("#sms > .p-0 > .justify-between").click();
        cy.get("#activeJourney").click();
        cy.contains(smsTemplate.name).click();
        cy.get("#exportSelectedTemplate").click();
      });
    });
  }
);
