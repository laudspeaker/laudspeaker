/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */

import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";

const { userAPIkey, email, password } = credentials.MessageHitUser;

describe(
  "Journey with email triggered",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      cy.get("#audience").click();
      cy.get("#users").click();
      cy.get("#create-customer-button").click();
      cy.get("#name").type("New Customer");
      cy.get("#create-person-modal-button").click();
      cy.wait(1000);
      cy.reload();
      cy.wait(10000);
      cy.contains("New Customer").should("exist");
    });
  }
);
