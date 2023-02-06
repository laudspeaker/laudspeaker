/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import checkSuccessfulEmailEventHit from "../test-helpers/checkSuccessfulEmailEventHit";
import { loginFunc } from "../test-helpers/loginFunc";
import runTwoStepEmailJourney from "../test-helpers/runTwoStepEmailJourney";
import setFree3 from "../test-helpers/setFree3";
import setMailgun from "../test-helpers/setMailgun";
import setSendgrid from "../test-helpers/setSendgrid";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, emailTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

describe(
  "Switching email providers",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      Cypress.on("uncaught:exception", () => {
        return false;
      });
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
    });

    it("free3 -> sendgrid", () => {
      loginFunc(email, password);
      templatesFunc();

      setFree3();
      cy.contains("Messaging").click();
      runTwoStepEmailJourney(emailTemplate.name, emailTemplate.eventName);

      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue
      );

      setSendgrid();
      cy.contains("Messaging").click();

      runTwoStepEmailJourney(
        emailTemplate.name,
        emailTemplate.eventName + "2",
        "2"
      );
      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName + "2",
        "email",
        emailTemplate.correlationValue
      );
    });

    it("free3 -> mailgun", () => {
      loginFunc(email, password);
      templatesFunc();

      setFree3();
      cy.contains("Messaging").click();
      runTwoStepEmailJourney(emailTemplate.name, emailTemplate.eventName);

      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue
      );

      setMailgun();
      cy.contains("Messaging").click();

      runTwoStepEmailJourney(
        emailTemplate.name,
        emailTemplate.eventName + "2",
        "2"
      );
      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName + "2",
        "email",
        emailTemplate.correlationValue
      );
    });

    it("mailgun -> sendgrid", () => {
      loginFunc(email, password);
      templatesFunc();

      runTwoStepEmailJourney(emailTemplate.name, emailTemplate.eventName);

      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue
      );

      setSendgrid();
      cy.contains("Messaging").click();

      runTwoStepEmailJourney(
        emailTemplate.name,
        emailTemplate.eventName + "2",
        "2"
      );
      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName + "2",
        "email",
        emailTemplate.correlationValue
      );
    });
  }
);
