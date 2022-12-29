/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import checkFailedEmailEventHit from "../test-helpers/checkFailedEmailEventHit";
import checkSuccessfulEmailEventHit from "../test-helpers/checkSuccessfulEmailEventHit";
import { loginFunc } from "../test-helpers/loginFunc";
import runTwoStepEmailJourney from "../test-helpers/runTwoStepEmailJourney";
import setFree3 from "../test-helpers/setFree3";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, emailTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

describe(
  "Free3 with two steps",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      templatesFunc();
      setFree3();
      cy.get(".-mb-px > :nth-child(1)").click();
      cy.get("#email").clear().type("testmail1@gmail.com");
      cy.get(".inline-flex").click();
      cy.contains("Messaging").click();
      runTwoStepEmailJourney(emailTemplate.name, emailTemplate.eventName);

      checkFailedEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        "testmail1@gmail.com"
      );
    });
  }
);
