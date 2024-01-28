import credentials from "../fixtures/credentials";
import {sendPassword} from "../test-helpers/sendPassword";

const { email } = credentials;

describe("signup", () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
    cy.clearAllCookies()
    cy.clearAllLocalStorage()
    cy.clearAllSessionStorage()
  });

  it("passes", () => {
    sendPassword(email);
    cy.url().should("include", "/home");
  });
});