import credentials from "../fixtures/credentials";
import signup from "../test-helpers/signup";

const { email, password, firstName, lastName } = credentials;

describe("signup", () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
  });

  it("passes", () => {
    signup(email, password, firstName, lastName);
    cy.url().should("include", "/home");
  });
});
