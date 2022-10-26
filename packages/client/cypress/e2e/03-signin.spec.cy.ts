import credentials from "../fixtures/credentials.json";

const { email, password } = credentials;

describe("signin", () => {
  it("passes", () => {
    cy.visit("/");
    cy.clearCookies();
    cy.clearCookies();
    cy.url().should("include", "/login");
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.get("#loginIntoAccount").click();
    cy.contains("Active Journeys").should("exist");
  });
});
