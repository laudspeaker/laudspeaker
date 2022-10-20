/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials.json";

const { email, password, slackTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

describe(
  "Journey with slack triggered and created",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    it("passes", async () => {
      cy.visit("/");
      cy.clearCookies();
      cy.clearCookies();
      cy.url().should("include", "/login");
      cy.get("#email").type(email);
      cy.get("#password").type(password);
      cy.get(".css-0 > .MuiGrid-root > .MuiButton-root").click();
      cy.url().should("include", "/dashboard");
      cy.reload();
      cy.url().should("include", "/dashboard");

      cy.get('[href="/all-templates"] > .MuiListItem-root').click();
      cy.url().should("include", "/all-templates");

      cy.get(".MuiButton-root").click();
      cy.get("#name").type(slackTemplate.name);
      cy.get("#handleDay").click();
      cy.get('[data-value="slack"]').click();
      cy.get(".MuiPaper-root > .MuiBox-root > .MuiButton-root").click();
      cy.get(".css-8dmme6").click();
      cy.get("#slackMessage").type(slackTemplate.message, {
        parseSpecialCharSequences: false,
      });
      cy.get(":nth-child(2) > .MuiButton-root").click();

      cy.get(
        '[href="/all-templates"] > .MuiListItem-root > .MuiListItemButton-root'
      ).click();
      cy.url().should("include", "/all-templates");
      cy.contains(slackTemplate.name);

      cy.get('[href="/flow"]').click();

      cy.get("button").contains("Create Journey").click();
      cy.get("#name").should("exist").type(journeyName);
      cy.get('[data-createbox="true"] > button').click();
      cy.get("#audience").click();
      cy.get("#name").type("init");
      cy.get("#description").type("init description text");
      cy.get("[data-namesegmentbox] > button").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="true"]')
        .move({ deltaX: 100, deltaY: 100 });

      cy.get("#audience").click();
      cy.get("#name").type("slack audience");
      cy.get("#description").type("slack description");
      cy.get("[data-namesegmentbox] > button").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="false"]')
        .move({ deltaX: 100, deltaY: 300 });

      cy.get('[data-isprimary="false"]').click();
      cy.get("#slack").click();

      cy.get("#activeJourney").click();
      cy.contains("TestTemplateForSlackSending").click();
      cy.get("[data-slackexporttemplate] > button").click();

      cy.get(".react-flow__viewport").get('[data-isprimary="true"]').click();
      cy.get("#eventBased").click();
      cy.contains("Add Condition Or Group").click();

      cy.get('[data-value="events"]').click();
      cy.get("#events").type(slackTemplate.eventName);
      cy.get("[data-savetriggerreator] > button").click();

      cy.get('[data-isprimary="true"]')
        .get('[data-handlepos="bottom"]')
        .drag('[data-isprimary="false"] [data-handlepos="top"]');

      cy.get('[data-isprimary="false"] [data-handlepos="top"]').click();

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
            jobId: body.jobId,
          },
        }).then(({ body }) => {
          expect(body).to.equal("completed");
        });
      });
    });
  }
);
