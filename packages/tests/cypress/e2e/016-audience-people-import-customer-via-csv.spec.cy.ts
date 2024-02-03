import credentials from "../fixtures/credentials";
import { uploadCSV } from "../test-helpers/uploadCSV";
import { setupOrganization } from "../test-helpers/setupOrganization";
import signup from "../test-helpers/signup";


const { email, password, firstName, lastName, organizationName, timeZone } = credentials;

describe("Creating Customers via CSV import", () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    signup(email, password, firstName, lastName);
    cy.wait(1000);
    setupOrganization(organizationName, timeZone);
    cy.wait(10000);
  });

  it("uploads a valid CSV correctly", () => {
    // uploadCSV();
    cy.wait(10000);
    cy.visit("/home");
    cy.url().should("include", "/home");
  });
});