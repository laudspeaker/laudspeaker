import credentials from "../fixtures/credentials.json";

const { email, password, APIkey } = credentials;

describe("onboarding", () => {
  it("passes", () => {
    cy.visit("/");
    cy.clearCookies();
    cy.clearCookies();
    cy.url().should("include", "/login");
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.get(".css-0 > .MuiGrid-root > .MuiButton-root").click();
    cy.url().should("include", "/settings/channel");
    cy.get("#activeJourney").click();
    cy.get('[tabindex="0"] > .MuiBox-root').click();
    cy.get(".MuiButton-root").click();
    cy.url().should("include", "/settings/event-provider");
    cy.get(".MuiButton-root").click();
    cy.url().should("include", "/settings/email-configuration");
    cy.get("#name").type(APIkey);
    cy.get("#activeJourney").click();
    cy.get(".MuiMenuItem-root > .MuiBox-root").click();
    cy.get(".MuiButton-root").click();
    cy.url().should("include", "/settings/additional-settings");
    cy.get(":nth-child(2) > .MuiFormControl-root > .MuiInputBase-root > #name").type("John Smith");
    cy.get(".MuiButton-root").click();
    cy.url().should("include", "/settings/completion");
    cy.wait(100);
    cy.get(".MuiButton-root").click();
    cy.url().should("include", "/flow");
  });
});
