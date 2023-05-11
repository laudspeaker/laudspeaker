/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";
import runEmailJourney from "../test-helpers/runEmailJourney";
import setFree3 from "../test-helpers/setFree3";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, slackTemplate, emailTemplate } =
  credentials.MessageHitUser;

describe(
  "Teste3emails option check",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/api/tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      setFree3();
      templatesFunc(slackTemplate, emailTemplate);

      runEmailJourney("Email journey 1");
      cy.wait(10000);
      runEmailJourney("Email journey 2");
      cy.wait(10000);
      runEmailJourney("Email journey 3");
      cy.wait(10000);
      runEmailJourney("Email journey 4");
      cy.contains("You exceeded limit of 3 emails", { timeout: 10000 }).should(
        "exist"
      );
    });
  }
);
