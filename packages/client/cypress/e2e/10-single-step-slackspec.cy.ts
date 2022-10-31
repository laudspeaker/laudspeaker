/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials.json";
import { loginFunc } from "../test-helpers/loginFunc";
import { tamplatesFunc } from "../test-helpers/templatesFunc";

const {
  email,
  password,
  slackTemplate,
  emailTemplate,
  journeyName,
  userAPIkey,
} = credentials.MessageHitUser;

describe(
  "Journey with slack triggered and created",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    it("passes", async () => {
      loginFunc(email, password);
      tamplatesFunc(slackTemplate, emailTemplate);

      cy.get('[data-disclosure-link="Journey Builder"]').click();
      cy.wait(1000);
      cy.get("button").contains("Create Journey").click();
      cy.get("#name").should("exist").type(journeyName);
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
      cy.get("#events").type(slackTemplate.eventName);
      cy.get("[data-savetriggerreator] > button").click();

      cy.get("[data-saveflowbutton]").click();
      cy.wait(500);
      cy.get("[data-startflowbutton]").click();
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
            jobId: body[0],
          },
        }).then(({ body }) => {
          expect(body).to.equal("completed");
        });
      });
    });
  }
);
