/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import checkSuccessfulEmailEventHit from "../test-helpers/checkSuccessfulEmailEventHit";
import { loginFunc } from "../test-helpers/loginFunc";
import runTwoStepEmailJourney from "../test-helpers/runTwoStepEmailJourney";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password } = credentials.MessageHitUser;
const newPassword = "7182052222";

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
      cy.contains("TFNameUser").click();
      cy.contains("Logout").click();
      cy.get(".items-center > .font-medium").click();
      cy.get("#email").clear().type(email);
      cy.get("#loginIntoAccount").click();
      cy.request("http://localhost:3001/tests/test-recovery").then(
        ({ body: { id } }) => {
          cy.visit("/reset-password/" + id);

          cy.get("#newPassword").clear().type(newPassword);
          cy.get("#repeatNewPassword").clear().type(newPassword);
          cy.get("#loginIntoAccount").click();
          loginFunc(email, newPassword, false);
        }
      );
    });
  }
);
