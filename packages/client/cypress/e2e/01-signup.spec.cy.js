import credentials from "../fixtures/credentials.json";
import signup from "../test-helpers/signup";

const { email, password } = credentials;

describe("signup", () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
  });

  it("passes", () => {
    signup(email, password);
    cy.url().should("include", "/home");
  });
});
