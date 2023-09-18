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
      cy.contains("Finish later").click();
      cy.wait(1000);
      cy.get(".text-updater").move({ deltaX: 100, deltaY: 100, force: true });
      cy.wait(1000);
      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").type("Second");
      cy.contains("Finish later").click();
      cy.wait(1000);
      cy.get('[data-isprimary]:not([data-isprimary="true"])').move({
        deltaX: 100,
        deltaY: 300,
        force: true,
      });
      cy.wait(1000);
      cy.get("#sms > .p-0 > .justify-between").drag(
        '[data-isprimary]:not([data-isprimary="true"])'
      );
      cy.get("#activeJourney").click();
      cy.contains(smsTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();
      setupEventTrigger(
        '[data-isprimary="true"]',
        smsTemplate.eventName,
        smsTemplate.eventName
      );
      cy.get(
        '[style="display: flex; height: 22px; position: absolute; left: 0px; bottom: 0px; align-items: center; width: 100%; justify-content: space-around;"] > .react-flow__handle'
      ).drag('[data-isprimary]:not([data-isprimary="true"])', {
        force: true,
      });
      cy.contains("Delete").click();
      cy.wait(3000);
      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").clear().type("Step 3");
      cy.contains("Finish later").click();

      cy.contains("Step 3").move({ deltaX: 100, deltaY: 500 });
      cy.get("#email > .p-0 > .justify-between").drag(".text-updater:nth(2)");

      cy.get("#activeJourney").click();
      cy.contains(emailTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();
      cy.get(".text-updater:nth(1)").click();
      cy.get("#saveNewSegment").click();
      cy.wait(1000);
      cy.contains("Save").click();
      cy.reload();
      cy.wait(3000);
      cy.get("#saveSegmentParams").click();
      cy.wait(3000);
      cy.get(":nth-child(1) > .group > .px-6 > .ml-4").click();
      cy.wait(3000);
      setupEventTrigger(
        ".text-updater:nth(1)",
        emailTemplate.eventName,
        emailTemplate.eventName
      );
      cy.wait(1000);
      cy.get(".text-updater-node:nth(1) .react-flow__handle:last").drag(
        '[data-isprimary]:not([data-isprimary="true"]):contains("Step 3")',
        { force: true }
      );
      cy.wait(1000);
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
      }).then(({ isOkStatusCode }) => {
        cy.wait(2000);
        expect(isOkStatusCode).to.be.equal(true);

        cy.request({
          method: "POST",
          url: `${Cypress.env("AxiosURL")}events`,
          headers: {
            Authorization: `Api-Key ${userAPIkey}`,
          },
          body: {
            correlationKey: "phone",
            correlationValue: Cypress.env("TESTS_SMS_TO") || smsTemplate.phone,
            event: { [emailTemplate.eventName]: emailTemplate.eventName },
          },
        }).then(({ body }) => {
          cy.wait(5000);
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
  }
);
