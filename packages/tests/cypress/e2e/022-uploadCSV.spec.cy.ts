import credentials from "../fixtures/credentials";
import signup from "../test-helpers/signup";
import { setupOrganization } from "../test-helpers/setupOrganization";
import { uploadCSV } from "../test-helpers/uploadCSV";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

const mapField = (field: string, option: string) => {
  cy.get(`[data-testid='mapping-select-${field}-button']`).click({
    force: true,
  });
  cy.get("[data-testid='select-input']").type(option, { force: true });
  cy.get(`[data-testid='mapping-select-${field}-option-${option}']`).click({
    force: true,
  });
};

describe("Comprehensive MultiSplit", () => {
  beforeEach(() => {
    try {
      cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
      cy.wait(1000);
      cy.clearAllCookies();
      cy.clearAllLocalStorage();
      cy.clearAllSessionStorage();
      signup(email, password, firstName, lastName);
      cy.wait(1000);
      setupOrganization(organizationName, timeZone);
      cy.wait(10000);
      cy.visit("/home");
      cy.url().should("include", "/home");
      // loginFunc(email, password);
    } catch (e) {
      console.log(e);
    }
  });

  it("works as expected", () => {
    cy.modifyAttributes();

    uploadCSV("correctness_testing.csv");

    mapField("name", "name");
    mapField("user_id", "user_id");
    mapField("is_delete", "is_delete");
    mapField("is_own_car", "is_own_car");
    mapField("credit_score", "credit_score");
    mapField("recent_appl_date", "recent_appl_date");
    mapField("recent_repay_amt", "recent_repay_amt");

    cy.wait(1000);
    cy.get("[data-testid='next-button']").click({ force: true });
    cy.get("[data-testid='confirm-validation-button']").click({ force: true });

    cy.contains("From your file, we can", { timeout: 20000 }).should(
      "be.visible"
    );
    cy.get("[data-testid='import-button']").click({ force: true });

    cy.wait(5000);
    cy.reload();

    cy.get("[data-testid='user-search-button']").should("be.visible");
    cy.get("[data-testid='id-header']").should("be.visible");
    cy.get("[data-testid='pk-header']").should("be.visible");
    cy.get("[data-testid='sort-header']").should("be.visible");
  });
});
