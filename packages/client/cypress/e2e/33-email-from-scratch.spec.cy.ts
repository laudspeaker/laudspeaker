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

const getIframeDocument = () => {
  return (
    cy
      .get(".gjs-frame")
      // Cypress yields jQuery element, which has the real
      // DOM element under property "0".
      // From the real DOM iframe element we can get
      // the "document" element, it is stored in "contentDocument" property
      // Cypress "its" command can access deep properties using dot notation
      // https://on.cypress.io/its
      .its("0.contentDocument")
      .should("exist")
  );
};

const getIframeBody = () => {
  // get the document
  return (
    getIframeDocument()
      // automatically retries until body is loaded
      .its("body")
      .should("not.be.undefined")
      // wraps "body" DOM element to allow
      // chaining more Cypress commands, like ".find(...)"
      .then(cy.wrap)
  );
};

describe(
  "Journey with rich email from scratch triggered",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/api/tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      cy.contains("Messaging").click();
      cy.contains("Template Builder").click();
      cy.contains("Create Template").click();
      cy.get("#name").clear().type("Rich email");
      cy.get("#handleTemplateType").click();
      cy.get("#handleTemplateType").find('[data-option="email"]').click();
      cy.get("#submitTemplateCreation").click();
      cy.get('[data-custominput-placeholder="Subject"]')
        .click("left")
        .click({ force: true });
      cy.get('input[placeholder="Subject"]').clear().type("Rich email");

      cy.get(".gjs-f-b1").drag(".gjs-frame");

      cy.get("#saveDraftTemplate").click();
      runTwoStepEmailJourney("Rich email", emailTemplate.eventName);

      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue
      );
    });
  }
);
