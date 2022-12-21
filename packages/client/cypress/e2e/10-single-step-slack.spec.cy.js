/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials.json";
import createNewSegment from "../test-helpers/createNewSegment";
import { loginFunc } from "../test-helpers/loginFunc";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { tamplatesFunc } from "../test-helpers/templatesFunc";

const { email, password, slackTemplate, emailTemplate } =
  credentials.MessageHitUser;

describe(
  "Journey with slack triggered and created",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      tamplatesFunc(slackTemplate, emailTemplate);

      cy.get('[data-disclosure-link="Journey Builder"]').click();
      cy.wait(1000);
      cy.get("button").contains("Create Journey").click();
      cy.get("#name").should("exist").type("Single step flow");
      cy.get("#createJourneySubmit").click();
      cy.wait(500);
      cy.get("#audience").click();
      cy.get("#name").type("init");
      cy.get("#description").type("init description text");
      cy.get("#saveNewSegment").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="true"]')
        .move({ deltaX: 100, deltaY: 100 })
        .click();
      cy.get("#slack").click();
      cy.get("#activeJourney").click();
      cy.get("[data-option]").click();
      cy.get("#exportSelectedTemplate").click();

      cy.get(".react-flow__viewport").get('[data-isprimary="true"]').click();
      setupEventTrigger(slackTemplate.eventName, slackTemplate.eventName);

      createNewSegment();

      cy.contains("Save").click();
      cy.wait(500);
      cy.contains("Start").click();
      cy.wait(500);

      cy.visit("/flow");
      cy.wait(500);
    });
  }
);
