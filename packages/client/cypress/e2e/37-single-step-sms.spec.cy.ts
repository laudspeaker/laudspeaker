/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import createNewSegment from "../test-helpers/createNewSegment";
import { loginFunc } from "../test-helpers/loginFunc";
import runEmailJourney from "../test-helpers/runEmailJourney";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, smsTemplate } = credentials.MessageHitUser;

describe(
  "Journey with single step sms triggered",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("AxiosURL")}tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      templatesFunc();

      cy.get('[data-disclosure-link="Journey Builder"]').click();
      cy.wait(100);
      cy.get(".mt-6 > .inline-flex").click();
      cy.get("#name").type("Single step sms");
      cy.get("#createJourneySubmit").click();
      cy.wait(3000);
      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").type("Initial");
      cy.get("#saveNewSegment").click();
      cy.contains("Finish later").click();
      cy.get(".text-updater").move({ deltaX: 100, deltaY: 100 });
      cy.get("#sms > .p-0 > .justify-between").click();
      cy.get("#activeJourney").click();
      cy.contains(smsTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();

      createNewSegment();

      cy.contains("Save").click();
      cy.wait(1000);
      cy.contains("Start").click();
      cy.wait(3000);
    });
  }
);
