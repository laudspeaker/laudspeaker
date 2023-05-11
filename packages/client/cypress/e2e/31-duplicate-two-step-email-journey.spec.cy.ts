/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import checkSuccessfulEmailEventHit from "../test-helpers/checkSuccessfulEmailEventHit";
import { loginFunc } from "../test-helpers/loginFunc";
import runTwoStepEmailJourney from "../test-helpers/runTwoStepEmailJourney";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, emailTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

describe(
  "Journey with email triggered",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/api/tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      templatesFunc();
      runTwoStepEmailJourney(emailTemplate.name, emailTemplate.eventName);

      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue
      );

      cy.contains("Journey Builder").click();
      cy.wait(1000);
      cy.contains("Email flow")
        .parent("td")
        .parent("tr")
        .children("td:nth-child(3)")
        .children("div")
        .children("button")
        .click();
      cy.get("[data-duplicate-button]").click();
      cy.wait(1000);
      cy.contains("Email flow-copy-1").click();
      cy.contains("Start").click();
      cy.wait(3000);
      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue
      );
    });
  }
);
