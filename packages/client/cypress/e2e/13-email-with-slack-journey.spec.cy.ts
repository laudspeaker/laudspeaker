/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials.json";
import { loginFunc } from "../test-helpers/loginFunc";
import { tamplatesFunc } from "../test-helpers/templatesFunc";

const { email, password, slackTemplate, userAPIkey, emailTemplate } =
  credentials.MessageHitUser;

describe(
  "Email and slack journey",
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
      cy.get("#name").should("exist").type("Email and slack journey");
      cy.get("#createJourneySubmit").click();
      cy.wait(500);
      cy.get("#audience").click();
      cy.get("#name").type("init");
      cy.get("#description").type("init description text");
      cy.get("#saveNewSegment").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="true"]')
        .move({ deltaX: 100, deltaY: 100 });

      cy.wait(500);
      cy.get("#audience").click();
      cy.get("#name").type("slack audience");
      cy.get("#description").type("slack description");
      cy.get("#saveNewSegment").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="false"]')
        .move({ deltaX: 100, deltaY: 300 });

      cy.get('[data-isprimary="false"]').click();
      cy.get("#slack").click();

      cy.get("#activeJourney").click();
      cy.contains(slackTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();

      cy.get("#email").click();
      cy.get("#activeJourney").click();
      cy.contains(emailTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();

      cy.get(".react-flow__viewport").get('[data-isprimary="true"]').click();
      cy.get("#eventBased").click();
      cy.contains("Add Condition Or Group").click();

      cy.get('[data-option="events"]').click();
      cy.get("#events").type(slackTemplate.eventName);
      cy.get("[data-savetriggerreator] > button").click();

      cy.get('[data-isprimary="true"]')
        .get('[data-handlepos="bottom"]')
        .drag('[data-isprimary="false"] [data-handlepos="top"]');

      cy.get('[data-isprimary="false"] [data-handlepos="top"]').click();

      cy.contains("Save").click();
      cy.wait(500);
      cy.contains("Start").click();
      cy.wait(500);

      cy.visit("/flow");
      cy.wait(500);

      cy.request({
        method: "POST",
        url: `${Cypress.env("AxiosURL")}events`,
        headers: {
          Authorization: `Api-Key ${userAPIkey}`,
        },
        body: {
          correlationKey: "slackId",
          correlationValue: slackTemplate.slackUid,
          event: slackTemplate.eventName,
        },
      }).then(({ body }) => {
        cy.wait(1000);
        cy.request({
          method: "POST",
          headers: {
            Authorization: `Api-Key ${userAPIkey}`,
          },
          url: `${Cypress.env("AxiosURL")}events/job-status/slack`,
          body: {
            jobId: body[0]?.jobIds?.[0],
          },
        }).then(({ body }) => {
          expect(body).to.equal("completed");
        });
      });
    });
  }
);
