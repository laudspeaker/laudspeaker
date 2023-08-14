/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import checkSuccessfulEmailEventHit from "../test-helpers/checkSuccessfulEmailEventHit";
import drag from "../test-helpers/drag";
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
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      cy.get("#messaging > .relative").click();
      cy.get("#journeys").click();
      cy.get("#create-journey").click();
      cy.get("#journey-name-input").type("Journey name");
      cy.get("#create-journey-modal-button").click();
      cy.wait(1000);
      drag("#email", ".empty-node");
      cy.get("#template-select").select("example-template-review");
      cy.get("#save-node-data").click();
      drag("#exit", ".empty-node");
      cy.get("#next-button").click();
      cy.get("#next-button").click();
      cy.get("#start-journey-button").click();
      cy.get("#journey-start-verify-button").click();
      cy.wait(10000);
      cy.reload();
      cy.get(".sent > .stat-result").should("contain.text", "1");
    });
  }
);
