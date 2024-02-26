import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";
import { setupOrganization } from "../test-helpers/setupOrganization";
import signup from "../test-helpers/signup";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

describe("company-setup", () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    signup(email, password, firstName, lastName);
    cy.wait(1000);
  });

  it("passes", () => {
    setupOrganization(organizationName, timeZone);
    cy.wait(10000);
    cy.visit("/home");
    cy.url().should("include", "/home");
  });
});
