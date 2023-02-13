/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */

import credentials from "../fixtures/credentials";
import createDatabaseIntegration from "../test-helpers/createDatabaseIntegration";
import { loginFunc } from "../test-helpers/loginFunc";

const { email, password } = credentials.MessageHitUser;

describe(
  "Edit database integration",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("AxiosURL")}tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      createDatabaseIntegration();
      cy.contains("dbName1")
        .parent("td")
        .parent("tr")
        .children("td:nth-child(4)")
        .children("div")
        .children("button")
        .click();
      cy.contains("Edit").click();
      cy.get("#description").clear().type("AnotherDescriotion");
      cy.contains("Next").click();
      cy.contains("Next").click();
      cy.contains("Next").click();
      cy.contains("Next").click();
      cy.wait(5000);
      cy.contains("Save").click();
      cy.contains("dbName1")
        .parent("td")
        .parent("tr")
        .children("td:nth-child(4)")
        .children("div")
        .children("button")
        .click();
      cy.contains("Edit").click();
      cy.get("#description").should("have.value", "AnotherDescriotion");
    });
  }
);
