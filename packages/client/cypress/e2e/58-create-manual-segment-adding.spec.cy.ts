/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */

import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";

const { email, password } = credentials.MessageHitUser;

describe(
  "Create manual segment from empty csv and add customers manually",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("AxiosURL")}tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      cy.get('[data-disclosure="Audience"]').click();
      cy.get('[data-disclosure-link="Segments"]').click();
      cy.get("#createTemplate").click();
      cy.get("#name").type("Segment 1");
      cy.contains("automatic").click();
      cy.get("#data-option-manual > :nth-child(1) > div").click();
      cy.get("#submitTemplateCreation").click();
      cy.get("#dropzone-file").selectFile(
        {
          contents: "cypress/fixtures/empty-customers-for-segemnt.csv",
        },
        {
          force: true,
        }
      );
      cy.wait(1000);
      cy.get("#createTemplate").click();
      cy.contains("Add existing customer").click();
      cy.wait(1000);
      cy.get(".divide-y > tr > :nth-child(3) > button").click();
      cy.get("#close-modal").click();
      cy.get(".divide-y > tr > :nth-child(1)").should("exist");
      cy.get('[data-disclosure-link="Segments"]').click();
      cy.get(".divide-y > tr > :nth-child(1)").should("exist");
      cy.get(".divide-y > tr > :nth-child(2)").should("contain", "manual");
    });
  }
);
