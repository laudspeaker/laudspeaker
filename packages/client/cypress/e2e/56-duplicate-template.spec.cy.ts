/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */

import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";

const { email, password } = credentials.MessageHitUser;

describe(
  "Duplicate template",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("TESTS_API_BASE_URL")}tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      cy.get('[data-disclosure="Messaging"]').click();
      cy.get('[data-disclosure-link="Journey Builder"]').click();
      cy.get(".divide-y > :nth-child(1) > :nth-child(3)").click();
      cy.contains("Duplicate").click();
      cy.contains("example-onboarding-copy-1").should("exist");
    });
  }
);
