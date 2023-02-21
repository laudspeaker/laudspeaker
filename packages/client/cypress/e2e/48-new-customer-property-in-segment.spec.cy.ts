/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */

import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, emailTemplate, slackTemplate } =
  credentials.MessageHitUser;

const newProperty = "weight";
const value = "150kg";

describe(
  "Segment with new property test",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("AxiosURL")}tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      templatesFunc(slackTemplate, emailTemplate);
      cy.contains("Audience").click();
      cy.contains("People").click();
      cy.get(":nth-child(1) > .MuiTypography-root").click();
      cy.contains("Edit").click();
      cy.contains("New attribute").click();
      cy.get('[placeholder="key"]').clear().type(newProperty);
      cy.get('[placeholder="value"]').clear().type(value);
      cy.contains("Add").click();
      cy.contains("Save").click();
      cy.contains("Messaging").click();
      cy.contains("Journey Builder").click();
      cy.contains("Create Journey").click();
      cy.get("#name").clear().type("Segment with new property test");
      cy.get("#createJourneySubmit").click();
      cy.wait(3000);
      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").type("init");
      cy.get("#description").type("init description text");
      cy.contains("Finish later").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="true"]')
        .move({ deltaX: 100, deltaY: 100 })
        .click();
      cy.get("#email").click();
      cy.get("#activeJourney").click();
      cy.contains(emailTemplate.name).click();
      cy.wait(3000);
      cy.get("#exportSelectedTemplate").click();

      cy.contains("Next").click();
      cy.get("#segmentName").click();
      cy.contains("Create new").click();
      cy.get("#segmentName").type("New property test segment");
      cy.get("#submitSegmentCreate").click();
      cy.get("#event-conditions button").click();
      cy.contains("Attributes").click();
      cy.wait(1000);
      cy.get("#event-conditions:first > div:last").click();
      cy.wait(1000);
      cy.get('[data-option="weight"]').click();
      cy.wait(1000);
      cy.get("#event-conditions:first > div:last button").click();
      cy.wait(1000);
      cy.contains("is equal to").click();
      cy.wait(1000);
      cy.get("#isEqual").clear().type(value);
      cy.get("#saveSegmentParams").click();
      cy.wait(1000);
      cy.contains("Next").click();

      cy.contains("Save").click();
      cy.contains("Start").click();
    });
  }
);
