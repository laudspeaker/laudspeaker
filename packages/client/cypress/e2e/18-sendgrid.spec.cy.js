/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";
import runEmailJourney from "../test-helpers/runEmailJourney";
import setFree3 from "../test-helpers/setFree3";
import setSendgrid from "../test-helpers/setSendgrid";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, slackTemplate, emailTemplate } =
  credentials.MessageHitUser;

const { TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL } = Cypress.env();

describe(
  "Sendgrid check",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("AxiosURL")}tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      setSendgrid(TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL);
      templatesFunc(slackTemplate, emailTemplate);
      runEmailJourney("Sendgrid email journey");
    });
  }
);
