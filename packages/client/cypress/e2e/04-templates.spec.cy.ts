import credentials from "../fixtures/credentials.json";

const { email, password } = credentials;

describe("templates", () => {
  it("passes", () => {
    cy.visit("/");
    cy.clearCookies();
    cy.clearCookies();
    cy.url().should("include", "/login");
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.get(".css-0 > .MuiGrid-root > .MuiButton-root").click();
    cy.url().should("include", "/dashboard");
    cy.reload();

    cy.get(
      '[href="/all-templates"] > .MuiListItem-root > .MuiListItemButton-root'
    ).click();
    cy.url().should("include", "/all-templates");
    cy.get(".MuiButton-root").click();
    cy.get("#name").type("With email");
    cy.get("#handleDay").click();
    cy.get('.MuiList-root > [tabindex="0"]').click();
    cy.get(".MuiPaper-root > .MuiBox-root > .MuiButton-root").click();
    cy.get("#title").type("with email");
    cy.get(":nth-child(2) > .MuiButton-root").click();

    cy.get(
      '[href="/all-templates"] > .MuiListItem-root > .MuiListItemButton-root'
    ).click();
    cy.wait(100);
    cy.url().should("include", "/all-templates");
    cy.get(".MuiButton-root").click();
    cy.get("#name").type("With slack");
    cy.get("#handleDay").click();
    cy.get('[data-value="slack"]').click();
    cy.get(".MuiPaper-root > .MuiBox-root > .MuiButton-root").click();
    cy.get("#slackMessage").type("Slack message");
    cy.get(":nth-child(2) > .MuiButton-root").click();

    cy.get(
      '[href="/all-templates"] > .MuiListItem-root > .MuiListItemButton-root'
    ).click();
    cy.url().should("include", "/all-templates");
    cy.contains("With email");
    cy.contains("With slack");
  });
});
