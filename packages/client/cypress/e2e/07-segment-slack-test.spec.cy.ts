/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials.json";
import { loginFunc } from "../test-helpers/loginFunc";
import { tamplatesFunc } from "../test-helpers/templatesFunc";

const { email, password, slackTemplate, emailTemplate, userAPIkey } =
  credentials.MessageHitUser;

describe(
  "Segment slack test",
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
      cy.get("#name").should("exist").type("Segment slack test");
      cy.get("#createJourneySubmit").click();
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
      cy.get("#eventBased").click();
      cy.contains("Add Condition Or Group").click();

      cy.get('[data-option="events"]').click();
      cy.get("#events").type("Segment event name");
      cy.get("[data-savetriggerreator] > button").click();

      cy.get(".react-flow__viewport").get('[data-isprimary="true"]').dblclick();
      cy.contains("Add Condition Or Group").click();
      cy.get('[data-option="attributes"]').click();
      cy.get('[class="flex flex-[1] flex-wrap"]')
        .find("div:nth-child(2)")
        .click();
      cy.get('[data-option="slackEmail"]').click();
      cy.get('[class="flex flex-[1] flex-wrap"]')
        .find("div:nth-child(3)")
        .click();
      cy.get('[data-option="contains"]').click();
      cy.get("#contains").clear().type("mad@try");
      cy.get("#saveSegmentParams").click();

      cy.contains("Save").click();
      cy.wait(500);
      cy.contains("Start").click();
      cy.wait(500);

      cy.visit("/flow");
      cy.wait(500);
    });
  }
);
