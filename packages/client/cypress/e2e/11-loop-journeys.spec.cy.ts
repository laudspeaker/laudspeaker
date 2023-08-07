/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import createNewSegment from "../test-helpers/createNewSegment";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, slackTemplate, userAPIkey, emailTemplate } =
  credentials.MessageHitUser;

describe(
  "Loop journeys",
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
      drag("#waitUntil", ".empty-node");
      cy.get(".condition-editor > :nth(2) > :nth(1)").click();
      cy.contains("Property").click();
      cy.get(".property-name").click().type("A");
      cy.get(".condition-editor > :nth(0)").click();
      cy.get(".value-type-select").select("String");
      cy.get(".dynamic-input > .w-full").click().type("A");
      cy.get(".save-condition").click();
      cy.get("#save-node-data").click();

      drag("#email", ".empty-node:nth(0)");
      cy.get("#template-select").select("example-template-review");
      cy.get("#save-node-data").click();

      drag("#jumpTo", ".empty-node");
      cy.get("#save-node-data").click();
      drag(".jump-to-dragging-source", ".wait-until-node");
      cy.get(".jump-to-dragging-source").drag(".wait-until-node");
    });
  }
);
