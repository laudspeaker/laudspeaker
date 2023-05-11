/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";
import runEmailJourney from "../test-helpers/runEmailJourney";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, slackTemplate, emailTemplate } =
  credentials.MessageHitUser;

describe(
  "Journey with single step email triggered for 2 users",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/api/tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      cy.contains("Audience").click();
      cy.contains("People").click();
      cy.contains("Create Person").click();
      cy.get("#name").type("NewUser");
      cy.get(".bg-white > .mt-6 button").click();
      cy.wait(5000);
      cy.contains("Edit").click();
      cy.contains("New attribute").click();
      cy.get(":nth-child(6) > :nth-child(1) > .relative > .mt-1").type("email");
      cy.get(":nth-child(2) > .relative > .mt-1").type("some-email@gmail.com");
      cy.contains("Add").click();
      cy.contains("Save").click();
      templatesFunc(slackTemplate, emailTemplate);
      runEmailJourney();
    });
  }
);
