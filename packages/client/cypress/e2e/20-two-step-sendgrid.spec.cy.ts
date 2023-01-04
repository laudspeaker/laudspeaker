/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import checkSuccessfulEmailEventHit from "../test-helpers/checkSuccessfulEmailEventHit";
import { loginFunc } from "../test-helpers/loginFunc";
import runTwoStepEmailJourney from "../test-helpers/runTwoStepEmailJourney";
import setSendgrid from "../test-helpers/setSendgrid";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, emailTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

const { TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL } = Cypress.env();

describe(
  "Sendgrid with two steps",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      templatesFunc();
      setSendgrid(TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL);
      cy.contains("Messaging").click();
      runTwoStepEmailJourney(emailTemplate.name, emailTemplate.eventName);

      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue
      );
    });
  }
);
