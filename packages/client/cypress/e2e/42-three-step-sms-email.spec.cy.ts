/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import createNewSegment from "../test-helpers/createNewSegment";
import { loginFunc } from "../test-helpers/loginFunc";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, emailTemplate, smsTemplate, userAPIkey } =
  credentials.MessageHitUser;

describe(
  "Journey with three steps",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      templatesFunc();

      cy.get('[data-disclosure-link="Journey Builder"]').click();
      cy.get(".mt-6 > .inline-flex").click();
      cy.get("#name").type("Email flow");
      cy.get("#createJourneySubmit").click();
      cy.wait(3000);
      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").type("Initial");
      cy.get("#saveNewSegment").click();
      cy.get(".text-updater").move({ deltaX: 100, deltaY: 100 });
      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").type("Second");
      cy.get("#saveNewSegment").click();
      cy.get('[data-isprimary]:not([data-isprimary="true"])').move({
        deltaX: 100,
        deltaY: 300,
      });
      cy.get('[data-isprimary]:not([data-isprimary="true"])').click();
      cy.get("#sms > .p-0 > .justify-between").click();
      cy.get("#activeJourney").click();
      cy.contains(smsTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();
      cy.get('[data-isprimary="true"]').click();
      setupEventTrigger(smsTemplate.eventName, smsTemplate.eventName);
      cy.get(
        '[style="display: flex; height: 15px; position: absolute; left: 0px; bottom: 0px; align-items: center; width: 100%; justify-content: space-around;"] > .react-flow__handle'
      ).drag('[data-isprimary]:not([data-isprimary="true"])', {
        force: true,
      });
      cy.get('[data-isprimary]:not([data-isprimary="true"])').click();

      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").clear().type("Step 3");
      cy.get("#saveNewSegment").click();

      cy.contains("Step 3").move({ deltaX: 100, deltaY: 500 });
      cy.get("#email > .p-0 > .justify-between").click();

      cy.get("#activeJourney").click();
      cy.contains(emailTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();

      cy.contains("Second").click();
      setupEventTrigger(emailTemplate.eventName, emailTemplate.eventName);
      cy.get(
        '.text-updater-node:not([data-isprimary="true"]) > [style="display: flex; height: 15px; position: absolute; left: 0px; bottom: 0px; align-items: center; width: 100%; justify-content: space-around;"] > .react-flow__handle'
      ).drag('[data-isprimary]:not([data-isprimary="true"])', { force: true });
      cy.get(
        '[data-isprimary]:not([data-isprimary="true"]):contains("Step 3")'
      ).click();

      createNewSegment();

      cy.contains("Save").click();
      cy.wait(1000);
      cy.contains("Start").click();
      cy.wait(3000);

      cy.request({
        method: "POST",
        url: `${Cypress.env("AxiosURL")}events`,
        headers: {
          Authorization: `Api-Key ${userAPIkey}`,
        },
        body: {
          correlationKey: "phone",
          correlationValue: Cypress.env("TESTS_SMS_TO") || smsTemplate.phone,
          event: { [smsTemplate.eventName]: smsTemplate.eventName },
        },
      }).then(({ body }) => {
        cy.wait(2000);
        cy.request({
          method: "POST",
          headers: {
            Authorization: `Api-Key ${userAPIkey}`,
          },
          url: `${Cypress.env("AxiosURL")}events/job-status/sms`,
          body: {
            jobId: body[0]?.jobIds?.[0],
          },
        }).then(({ body }) => {
          expect(body).to.equal("completed");

          cy.request({
            method: "POST",
            url: `${Cypress.env("AxiosURL")}events`,
            headers: {
              Authorization: `Api-Key ${userAPIkey}`,
            },
            body: {
              correlationKey: "phone",
              correlationValue:
                Cypress.env("TESTS_SMS_TO") || smsTemplate.phone,
              event: { [emailTemplate.eventName]: emailTemplate.eventName },
            },
          }).then(({ body }) => {
            cy.wait(1000);
            cy.request({
              method: "POST",
              headers: {
                Authorization: `Api-Key ${userAPIkey}`,
              },
              url: `${Cypress.env("AxiosURL")}events/job-status/email`,
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
  }
);
