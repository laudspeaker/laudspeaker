/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */

import credentials from "../fixtures/credentials";
import createDatabaseIntegration from "../test-helpers/createDatabaseIntegration";
import createPostgresqlIntegration from "../test-helpers/createPostgresqlIntegration";
import { loginFunc } from "../test-helpers/loginFunc";

const { email, password } = credentials.MessageHitUser;

describe(
  "Create database integration",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("AxiosURL")}tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes for databricks and valid data", () => {
      loginFunc(email, password);

      createDatabaseIntegration();
      cy.wait(10000);
      cy.contains("Audience").click();
      cy.contains("People").click();
      cy.get("td").should("have.length.above", 10);
    });

    it("doesn't pass for databricks and invalid data", () => {
      loginFunc(email, password);

      createDatabaseIntegration(
        "RandomName",
        "RandomDescription",
        "randomHost",
        "randomPath",
        "randomToken",
        false
      );
    });

    it("passes for postgresql and valid data", () => {
      loginFunc(email, password);

      createPostgresqlIntegration();
      cy.wait(10000);
      cy.contains("Audience").click();
      cy.contains("People").click();
      cy.get("td").should("have.length.above", 10);
    });

    it("doesn't pass for postgresql and invalid data", () => {
      loginFunc(email, password);

      createPostgresqlIntegration(
        "RandomName",
        "RandomDescription",
        "randomHost",
        "12412414",
        "randomUsername",
        "randomPassword",
        "randomDatabase",
        false
      );
    });
  }
);
