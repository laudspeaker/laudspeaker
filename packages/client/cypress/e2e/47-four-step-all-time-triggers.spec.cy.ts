/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import createNewSegment from "../test-helpers/createNewSegment";
import { loginFunc } from "../test-helpers/loginFunc";
import setupDelayTrigger from "../test-helpers/setupDelayTrigger";
import setupSpecificTimeTrigger from "../test-helpers/setupSpecificTimeTrigger";
import setupTimeWindowTrigger from "../test-helpers/setupTimeWindowTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const {
  email,
  password,
  emailTemplate,
  slackTemplate,
  journeyName,
  userAPIkey,
} = credentials.MessageHitUser;

const step1Name = "asfsagag";
const step2Name = "asaskjqwsfjqw";
const step3Name = "u2gpiug15";
const step4Name = "agagioug1vv";

describe(
  "Journey with four steps with all time triggers trigggered",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/api/tests/reset-tests`);
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
      cy.get("#name").type(step1Name);
      cy.contains("Finish later").click();
      cy.get(".text-updater").move({ deltaX: 100, deltaY: 100 });
      cy.get("#audience > .p-0 > .justify-between").click({ force: true });
      cy.get("#name").type(step2Name);
      cy.contains("Finish later").click();
      cy.get('[data-isprimary]:not([data-isprimary="true"])').move({
        deltaX: 100,
        deltaY: 300,
      });
      cy.get("#email > .p-0 > .justify-between").drag(
        '[data-isprimary]:not([data-isprimary="true"])'
      );
      cy.get("#activeJourney").click();
      cy.contains(emailTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();
      cy.wait(3000);
      setupDelayTrigger('[data-isprimary="true"]');
      cy.get(
        '[style="display: flex; height: 22px; position: absolute; left: 0px; bottom: 0px; align-items: center; width: 100%; justify-content: space-around;"] > .react-flow__handle'
      ).drag('[data-isprimary]:not([data-isprimary="true"])', {
        force: true,
      });
      cy.wait(1000);
      cy.get('[data-isprimary]:not([data-isprimary="true"])').click();
      cy.get("#saveNewSegment").click();
      cy.wait(3000);
      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").clear().type(step3Name);
      cy.contains("Finish later").click();
      cy.wait(1000);
      cy.contains(step3Name).move({ deltaX: 100, deltaY: 500 });
      cy.wait(1000);
      cy.get("#slack > .p-0 > .justify-between").drag(".text-updater:last");

      cy.get("#activeJourney").click();
      cy.contains(slackTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();

      cy.contains(step2Name).click();
      cy.wait(3000);
      setupSpecificTimeTrigger(".text-updater:nth(1)", 180000);
      cy.get(
        '.text-updater-node:nth(1) > [style="display: flex; height: 22px; position: absolute; left: 0px; bottom: 0px; align-items: center; width: 100%; justify-content: space-around;"] > .react-flow__handle'
      ).drag(
        `[data-isprimary]:not([data-isprimary="true"]):contains("${step3Name}")`,
        { force: true }
      );
      cy.wait(1000);
      cy.get(
        `[data-isprimary]:not([data-isprimary="true"]):contains("${step3Name}")`
      ).click();
      cy.get("#saveNewSegment").click();
      cy.wait(3000);
      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").clear().type(step4Name);
      cy.contains("Finish later").click();
      cy.wait(3000);
      cy.contains(step4Name).move({ deltaX: 100, deltaY: 700 });
      cy.wait(3000);
      cy.get("#slack > .p-0 > .justify-between").drag(".text-updater:last");

      cy.get("#activeJourney").click();
      cy.contains(slackTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();

      cy.wait(3000);
      setupTimeWindowTrigger(".text-updater:nth(2)");
      cy.get(
        '.text-updater-node:nth(2) > [style="display: flex; height: 22px; position: absolute; left: 0px; bottom: 0px; align-items: center; width: 100%; justify-content: space-around;"] > .react-flow__handle'
      ).drag("[data-isprimary]:nth(3)", { force: true });
      cy.get("[data-isprimary]:nth(3)").click();

      createNewSegment();

      cy.contains("Save").click();
      cy.wait(1000);
      cy.contains("Start").click();
      cy.wait(3000);
      cy.request(`${Cypress.env("AxiosURL")}tests/any-test-customer-id`).then(
        ({ body: id }) => {
          cy.wait(5 * 60 * 1000);
          cy.request(
            `${Cypress.env("AxiosURL")}tests/audience-by-customer/${id}`
          ).then(({ body: { name } }) => {
            expect(name).to.equal(step4Name);
          });
        }
      );
    });
  }
);
