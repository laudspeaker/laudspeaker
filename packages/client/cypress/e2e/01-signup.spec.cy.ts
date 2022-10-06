import credentials from "../fixtures/credentials.json";

const { email, password } = credentials;

describe("signup", () => {
  it("passes", () => {
    cy.visit("/");
    cy.clearCookies();
    cy.clearCookies();
    cy.get(".MuiTypography-body1 > .MuiTypography-root").click();
    cy.url().should("include", "/signup");
    cy.get("#firstName").click().type("John");
    cy.get("#lastName").type("Smith");
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.get("#confirmPassword").type(password);
    cy.get(".MuiGrid-direction-xs-column > .MuiButton-root").click();
    cy.url().should("include", "/settings/channel");
  });
});
