/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import createNewSegment from "../test-helpers/createNewSegment";
import { loginFunc } from "../test-helpers/loginFunc";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, slackTemplate, emailTemplate, userAPIkey } =
  credentials.MessageHitUser;

describe(
  "Segment slack test",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/api/tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      templatesFunc(slackTemplate, emailTemplate);

      cy.get('[data-disclosure-link="Journey Builder"]').click();
      cy.wait(1000);
      cy.get("button").contains("Create Journey").click();
      cy.get("#name").should("exist").type("Segment slack test");
      cy.get("#createJourneySubmit").click();
      cy.wait(3000);
      cy.get("#audience").click();
      cy.get("#name").type("init");
      cy.get("#description").type("init description text");
      cy.contains("Finish later").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="true"]')
        .move({ deltaX: 100, deltaY: 100 });
      cy.get("#slack").drag('[data-isprimary="true"]', { force: true });
      cy.get("#activeJourney").click();
      cy.get("[data-option]").click();
      cy.get("#exportSelectedTemplate").click();

      setupEventTrigger(
        '[data-isprimary="true"]',
        slackTemplate.eventName,
        slackTemplate.eventName
      );

      // cy.get(".react-flow__viewport").get('[data-isprimary="true"]').dblclick();
      createNewSegment(false);
      cy.wait(3000);
      cy.get("button.false").click();
      cy.get("#data-option-filteron > :nth-child(1) > div").click();
      cy.wait(1000);
      cy.get("#event-conditions button:last").click();
      cy.get('[data-option="attributes"]').click();
      cy.wait(1000);
      cy.get("#event-conditions:first > div:last").click();
      cy.get('[data-option="slackRealName"]').click();
      cy.wait(1000);
      cy.get("#event-conditions:first > div:last").click();
      cy.get('[data-option="contains"]').click();
      cy.get("#contains").clear().type("mad Cha");
      cy.get("#saveSegmentParams").click();
      cy.contains("Save").click();

      cy.contains("Save").click();
      cy.wait(500);
      cy.contains("Start").click();
      cy.wait(500);

      cy.visit("/flow");
      cy.wait(500);
    });
  }
);
