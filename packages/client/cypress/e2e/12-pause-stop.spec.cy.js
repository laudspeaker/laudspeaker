/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials.json";
import createNewSegment from "../test-helpers/createNewSegment";
import { loginFunc } from "../test-helpers/loginFunc";
import setFree3 from "../test-helpers/setFree3";
import setSendgrid from "../test-helpers/setSendgrid";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { tamplatesFunc } from "../test-helpers/templatesFunc";
import testPauseStop from "../test-helpers/testPauseStop";

const { email, password, slackTemplate, userAPIkey, emailTemplate } =
  credentials.MessageHitUser;

const resizeObserverLoopErrRegExp = /^ResizeObserver loop limit exceeded/;
const { TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL } = Cypress.env();

describe(
  "Pause and stop",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
      Cypress.on("uncaught:exception", () => {
        return false;
      });
    });

    it("passes for mailgun", () => {
      loginFunc(email, password);
      tamplatesFunc(slackTemplate, emailTemplate);

      testPauseStop();
    });

    it("passes for free3", () => {
      loginFunc(email, password);
      tamplatesFunc(slackTemplate, emailTemplate);
      setFree3();
      cy.contains("Messaging").click();

      testPauseStop();
    });

    it("passes for sendgrid", () => {
      loginFunc(email, password);
      tamplatesFunc(slackTemplate, emailTemplate);
      setSendgrid(TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL);
      cy.contains("Messaging").click();

      cy.get('[data-isprimary="false"]').click();
      cy.get("#slack").click();

      cy.get("#activeJourney").click();
      cy.contains(slackTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();

      cy.get(".react-flow__viewport").get('[data-isprimary="true"]').click();
      setupEventTrigger("A", "A");

      cy.get('[data-isprimary="true"]')
        .get('[data-handlepos="bottom"]')
        .drag('[data-isprimary="false"] [data-handlepos="top"]');

      cy.get('[data-isprimary="false"] [data-handlepos="top"]').click();
      cy.get('[data-isprimary="false"]').click();

      setupEventTrigger("B", "B");

      cy.get('[data-isprimary="false"] [data-handlepos="bottom"]').drag(
        '[data-isprimary="true"] [data-handlepos="top"]'
      );
      cy.get('[data-isprimary="true"] [data-handlepos="top"]').click();

      createNewSegment();

      cy.contains("Save").click();
      cy.wait(500);
      cy.contains("Start").click();
      cy.wait(500);
      cy.visit("/flow/Pause%20and%20stop%20flow/view");
      cy.url().should("contain", "/view");
      cy.wait(3000);
      cy.contains("Pause").click();

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
        expect(body?.[0]?.jobIDs?.[0]).to.equal(undefined);
        cy.wait(3000);
        cy.contains("Resume").click();
        cy.wait(3000);
        cy.request({
          method: "POST",
          url: `${Cypress.env("AxiosURL")}events`,
          headers: {
            Authorization: `Api-Key ${userAPIkey}`,
          },
          body: {
            correlationKey: "slackId",
            correlationValue: slackTemplate.slackUid,
            event: { A: "A" },
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
            cy.wait(1000);
            expect(body).to.equal("completed");
            cy.request({
              method: "POST",
              url: `${Cypress.env("AxiosURL")}events`,
              headers: {
                Authorization: `Api-Key ${userAPIkey}`,
              },
              body: {
                correlationKey: "slackId",
                correlationValue: slackTemplate.slackUid,
                event: { B: "B" },
              },
            }).then(() => {
              cy.wait(1000);
              cy.contains("Stop").click();
              cy.wait(1000);
              cy.contains("Yes").click();
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
                  event: { A: "A" },
                },
              }).then(({ body }) => {
                cy.wait(1000);
                expect(body?.[0]?.jobIDs?.[0]).to.equal(undefined);
              });
            });
          });
        });
      });
    });
  }
);
