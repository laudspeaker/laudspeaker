/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import createNewSegment from "../test-helpers/createNewSegment";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, slackTemplate, emailTemplate, userAPIkey } =
  credentials.MessageHitUser;

describe(
  "Multiple triggers",
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

      cy.get("#add-branch").click();
      cy.get(".add-condition:nth(1)").click();
      cy.get(".edit-condition:nth(1)").click();
      cy.get(".condition-editor > :nth(2) > :nth(1)").click();
      cy.get(".condition-editor").contains("Property").click();
      cy.get(".property-name").click().type("B");
      cy.get(".condition-editor > :nth(0)").click();
      cy.get(".value-type-select").select("String");
      cy.get(".dynamic-input > .w-full").click().type("B");
      cy.get(".save-condition").click();
      cy.get("#save-node-data").click();
      drag("#email", ".empty-node:nth(0)");
      cy.get("#template-select").select("example-template-review");
      cy.get("#save-node-data").click();
      drag("#email", ".empty-node:nth(1)");
      cy.get("#template-select").select("example-template-reactivation");
      cy.get("#save-node-data").click();
      drag("#exit", ".empty-node:nth()");
      cy.get(".fixed:nth(1)").click();
      drag("#exit", ".empty-node:nth()");
      cy.get("#next-button").click();
      cy.get("#next-button").click();
      cy.get("#start-journey-button").click();
      cy.get("#journey-start-verify-button").click();
      cy.wait(10000);
      cy.reload();

      cy.request({
        method: "POST",
        url: `${Cypress.env("AxiosURL")}events`,
        headers: {
          Authorization: `Api-Key ${userAPIkey}`,
        },
        body: {
          correlationKey: "email",
          correlationValue: emailTemplate.correlationValue,
          event: { A: "A" },
        },
      }).then(({ body }) => {
        cy.wait(5000);
        cy.reload();
        cy.get(".sent:nth(0) > .stat-result").should("contain.text", "1");
      });
    });
  }
);
