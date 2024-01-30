import credentials from "../fixtures/credentials";
import {sendPassword} from "../test-helpers/sendPassword";
import {resetPassword} from "../test-helpers/resetPassword";

const { email, password } = credentials;

describe("signup", () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
    cy.clearAllCookies()
    cy.clearAllLocalStorage()
    cy.clearAllSessionStorage()
    sendPassword(email)
  });

  it("passes", () => {
    // resetPassword(password);
    // cy.url().should("include", "/home");
  });
});