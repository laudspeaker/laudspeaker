import credentials from "../fixtures/credentials.json";

const { email, password } = credentials;

describe("signup", () => {
  it("passes", () => {
    cy.visit("/");
    cy.clearCookies();
    cy.url().should("include", "/login");
    cy.get('[href="/signup"]').click();
    cy.url().should("include", "/signup");
    cy.get("#firstName").click().type("John");
    cy.get("#lastName").type("Smith");
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.get("#confirmPassword").type(password);
    cy.get("#createAccount").click();
    cy.url().should("include", "/home");
  });
});
