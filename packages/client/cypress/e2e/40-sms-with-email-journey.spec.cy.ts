/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import createNewSegment from "../test-helpers/createNewSegment";
import { loginFunc } from "../test-helpers/loginFunc";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const {
  email,
  password,
  slackTemplate,
  userAPIkey,
  emailTemplate,
  smsTemplate,
} = credentials.MessageHitUser;

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
      templatesFunc(slackTemplate, emailTemplate);

      cy.get('[data-disclosure-link="Journey Builder"]').click();
      cy.wait(1000);
      cy.get("button").contains("Create Journey").click();
      cy.get("#name").should("exist").type("Email and slack journey");
      cy.get("#createJourneySubmit").click();
      cy.wait(3000);
      cy.get("#audience").click();
      cy.get("#name").type("init");
      cy.get("#description").type("init description text");
      cy.contains("Finish later").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="true"]')
        .move({ deltaX: 100, deltaY: 100 });

      cy.wait(3000);
      cy.get("#audience").click();
      cy.get("#name").type("slack audience");
      cy.get("#description").type("slack description");
      cy.contains("Finish later").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="false"]')
        .move({ deltaX: 100, deltaY: 300 });

      cy.get('[data-isprimary="false"]').click();
      cy.get("#sms > .p-0 > .justify-between").click();
      cy.get("#activeJourney").click();
      cy.contains(smsTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();
      cy.wait(3000);
      cy.get("#email").click();
      cy.get("#activeJourney").click();
      cy.contains(emailTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();

      cy.get(".react-flow__viewport").get('[data-isprimary="true"]').click();
      setupEventTrigger(smsTemplate.eventName, smsTemplate.eventName);

      cy.get('[data-isprimary="true"]')
        .get("[data-handle-bottom]")
        .drag('[data-isprimary="false"] [data-handle-top]', {
          force: true,
        });

      cy.get('[data-isprimary="false"] [data-handle-top]').click();

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
          correlationKey: "phone",
          correlationValue: Cypress.env("TESTS_SMS_TO") || smsTemplate.phone,
          event: { [smsTemplate.eventName]: smsTemplate.eventName },
        },
      }).then(({ body, isOkStatusCode }) => {
        expect(isOkStatusCode).to.be.equal(true);

        cy.wait(5000);

        cy.request({
          method: "POST",
          headers: {
            Authorization: `Api-Key ${userAPIkey}`,
          },
          url: `${Cypress.env("AxiosURL")}events/job-status/email`,
          body: {
            jobId: body[0]?.jobIds?.[0] || body[0]?.jobIds?.[1],
          },
        }).then(({ body }) => {
          expect(body).to.equal("completed");
        });
      });
    });
  }
);
