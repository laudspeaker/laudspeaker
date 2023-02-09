/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import createNewSegment from "../test-helpers/createNewSegment";
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
      templatesFunc(slackTemplate, emailTemplate);

      cy.get('[data-disclosure-link="Journey Builder"]').click();
      cy.wait(1000);
      cy.get("button").contains("Create Journey").click();
      cy.get("#name").should("exist").type("Loop journeys flow");
      cy.get("#createJourneySubmit").click();
      cy.wait(3000);
      cy.get("#audience").click();
      cy.get("#name").type("init");
      cy.get("#description").type("init description text");
      cy.get("#saveNewSegment").click();
      cy.contains("Finish later").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="true"]')
        .move({ deltaX: 100, deltaY: 100 }, { force: true });

      cy.wait(3000);
      cy.get("#audience").click();
      cy.get("#name").type("slack audience");
      cy.get("#description").type("slack description");
      cy.get("#saveNewSegment").click();
      cy.contains("Finish later").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="false"]')
        .move({ deltaX: 100, deltaY: 300 }, { force: true });

      cy.get('[data-isprimary="false"]').click();
      cy.get("#slack").click();

      cy.get("#activeJourney").click();
      cy.contains(slackTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();

      cy.get(".react-flow__viewport").get('[data-isprimary="true"]').click();
      setupEventTrigger("1", "1");

      cy.get('[data-isprimary="true"]')
        .get("[data-handle-bottom]")
        .drag('[data-isprimary="false"] [data-handle-top]', {
          force: true,
        });

      cy.get('[data-isprimary="false"] [data-handle-top]').click();
      cy.get('[data-isprimary="false"]').click();

      setupEventTrigger("2", "2");

      cy.get('[data-isprimary="false"] [data-handle-bottom]').drag(
        '[data-isprimary="true"] [data-handle-top]',
        {
          force: true,
        }
      );
      cy.get('[data-isprimary="true"] [data-handle-top]').click();

      createNewSegment();

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
          event: { 1: "1" },
        },
      }).then(({ body }) => {
        cy.wait(4000);
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
          cy.wait(1000);
          cy.request({
            method: "POST",
            url: `${Cypress.env("AxiosURL")}events`,
            headers: {
              Authorization: `Api-Key ${userAPIkey}`,
            },
            body: {
              correlationKey: "slackId",
              correlationValue: slackTemplate.slackUid,
              event: { 2: "2" },
            },
          }).then(({ body }) => {
            expect(body?.[0]?.jobIDs?.[0]).to.equal(undefined);
            cy.wait(1000);
            cy.request({
              method: "POST",
              url: `${Cypress.env("AxiosURL")}events`,
              headers: {
                Authorization: `Api-Key ${userAPIkey}`,
              },
              body: {
                correlationKey: "slackId",
                correlationValue: slackTemplate.slackUid,
                event: { 1: "1" },
              },
            }).then(({ body }) => {
              cy.wait(4000);
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
        });
      });
    });
  }
);
