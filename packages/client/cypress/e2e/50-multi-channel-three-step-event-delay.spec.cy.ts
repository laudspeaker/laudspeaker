/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import createNewSegment from "../test-helpers/createNewSegment";
import { loginFunc } from "../test-helpers/loginFunc";
import setupDelayTrigger from "../test-helpers/setupDelayTrigger";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, emailTemplate, userAPIkey, smsTemplate } =
  credentials.MessageHitUser;

describe(
  "Journey with three steps with event and delay trigger",
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
      cy.contains("Finish later").click();
      cy.get(".text-updater").move({ deltaX: 100, deltaY: 100 });
      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").type("Second");
      cy.get("#saveNewSegment").click();
      cy.contains("Finish later").click();
      cy.get('[data-isprimary]:not([data-isprimary="true"])').move({
        deltaX: 100,
        deltaY: 300,
      });

      cy.get("#email > .p-0 > .justify-between").click();
      cy.get("#activeJourney").click();
      cy.contains(emailTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();

      cy.get('[data-isprimary="true"]').click();
      setupEventTrigger(emailTemplate.eventName, emailTemplate.eventName);
      cy.get(
        '[style="display: flex; height: 22px; position: absolute; left: 0px; bottom: 0px; align-items: center; width: 100%; justify-content: space-around;"] > .react-flow__handle'
      ).drag('[data-isprimary]:not([data-isprimary="true"])', {
        force: true,
      });
      cy.get('[data-isprimary]:not([data-isprimary="true"])').click();

      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").clear().type("Step 3");
      cy.get("#saveNewSegment").click();
      cy.contains("Finish later").click();

      cy.contains("Step 3").move({ deltaX: 100, deltaY: 500 });

      cy.get("#sms > .p-0 > .justify-between").click();
      cy.get("#activeJourney").click();
      cy.contains(smsTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();
      cy.get('[data-isprimary="true"]').click();

      cy.contains("Second").click();
      setupDelayTrigger();
      cy.get(
        '.text-updater-node:not([data-isprimary="true"]) > [style="display: flex; height: 22px; position: absolute; left: 0px; bottom: 0px; align-items: center; width: 100%; justify-content: space-around;"] > .react-flow__handle'
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
          correlationKey: "email",
          correlationValue: emailTemplate.correlationValue,
          event: { [emailTemplate.eventName]: emailTemplate.eventName },
        },
      }).then(() => {
        cy.request(`${Cypress.env("AxiosURL")}tests/test-customer-id`).then(
          ({ body: id }) => {
            cy.wait(5000);
            cy.request(
              `${Cypress.env("AxiosURL")}tests/audience-by-customer/${id}`
            ).then(({ body: { name } }) => {
              expect(name).to.equal("Second");
            });
            cy.wait(80000);
            cy.request(
              `${Cypress.env("AxiosURL")}tests/audience-by-customer/${id}`
            ).then(({ body: { name } }) => {
              expect(name).to.equal("Step 3");
            });
          }
        );
      });
    });
  }
);
