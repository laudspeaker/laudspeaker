import credentials from "../fixtures/credentials";
import createTestCustomer from "../test-helpers/createTestCustomer";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";
import setMailgun from "../test-helpers/setMailgun";
import { setupOrganization } from "../test-helpers/setupOrganization";
import signup from "../test-helpers/signup";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

describe("upload from csv", () => {
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
    cy.viewport(1920, 1080);
    setupOrganization(organizationName, timeZone);
    createTestCustomer(email);
    cy.get("#segments").click();
    cy.contains("Create Segment").click();
    cy.get('[data-option="manual"]').click();
    cy.get(".w-fit > .border").type("Segment 1");
    cy.get('input[type="file"]').selectFile(
      "./cypress/fixtures/correctness_testing.csv",
      { force: true }
    );

    cy.wait(10000);

    cy.contains("correctness_testing").should("exist");
    cy.contains("Next").click();
    cy.contains("Select an attribute").first().click();
    cy.get('[data-option="_NEW_RECORD_;-;_NEW_RECORD_"]').click();
    cy.get(".w-fit > .border").type("name");
    cy.contains("Select type").click();
    cy.get('[data-option="String"]').click();
    cy.contains("Save").click();
    cy.contains("Next").click();
    cy.contains("Proceed").click();
    cy.contains("41").should("exist");
    cy.get(':contains("Import"):last').click();
    cy.get("#segments").click();
    cy.get("tbody.relative > * > :nth-child(1) > :first").click();
    cy.wait(10000);
    cy.reload();
    cy.contains("Eligible users: 41 Users").should("exist");
  });
});
