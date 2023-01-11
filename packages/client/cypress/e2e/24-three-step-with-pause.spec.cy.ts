/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import checkSuccessfulEmailEventHit from "../test-helpers/checkSuccessfulEmailEventHit";
import createNewSegment from "../test-helpers/createNewSegment";
import { loginFunc } from "../test-helpers/loginFunc";
import runTwoStepEmailJourney from "../test-helpers/runTwoStepEmailJourney";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const {
  email,
  password,
  emailTemplate,
  slackTemplate,
  journeyName,
  userAPIkey,
} = credentials.MessageHitUser;

describe(
  "Journey with three steps and pause after first event hit",
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
      cy.wait(5000);
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
      cy.get("#email > .p-0 > .justify-between").click();
      cy.get("#activeJourney").click();
      cy.contains(emailTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();
      cy.get('[data-isprimary="true"]').click();
      setupEventTrigger(emailTemplate.eventName, emailTemplate.eventName);
      cy.get(
        '[style="display: flex; height: 15px; position: absolute; left: 0px; bottom: 0px; align-items: center; width: 100%; justify-content: space-around;"] > .react-flow__handle'
      ).drag('[data-isprimary]:not([data-isprimary="true"])', {
        force: true,
      });
      cy.get('[data-isprimary]:not([data-isprimary="true"])').click();

      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").clear().type("Step 3");
      cy.get("#saveNewSegment").click();
      cy.wait(3000);
      cy.contains("Step 3").move({ deltaX: 100, deltaY: 500 });
      cy.get("#slack > .p-0 > .justify-between").click();

      cy.get("#activeJourney").click();
      cy.contains(slackTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();

      cy.contains("Second").click();
      setupEventTrigger(slackTemplate.eventName, slackTemplate.eventName);
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

      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue,
        () => {
          cy.wait(5000);
          cy.contains("Pause").click();
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
              event: { [slackTemplate.eventName]: slackTemplate.eventName },
            },
          }).then(({ body }) => {
            cy.wait(1000);
            expect(body[0]?.jobIds?.[0]).to.equal(undefined);
          });
        }
      );
    });
  }
);
