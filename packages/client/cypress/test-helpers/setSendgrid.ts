// eslint-disable-next-line import/no-extraneous-dependencies
import "@4tw/cypress-drag-drop";

const { TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL } = Cypress.env();

export default (
  apiKey: string = TESTS_SENDGRID_API_KEY,
  fromEmail: string = TESTS_SENDGRID_FROM_EMAIL
) => {
  cy.get('[data-disclosure-link="Settings"] > .bg-cyan-700').click();
  cy.get(".-mb-px > :nth-child(3)").click();
  cy.wait(1000);
  cy.contains("Sendgrid").click();
  cy.get("#sendgridApiKey").clear().type("any-value");
  cy.get("#sendgridFromEmail").type("any-value");
  cy.get(".inline-flex").click();
  cy.contains(
    "There is something wrong with your sendgrid account. Check if your email is verified"
  ).should("exist");
  cy.wait(3000);
  cy.reload();
  cy.get(".-mb-px > :nth-child(3)").click();
  cy.contains("Sendgrid").click();
  cy.get("#sendgridApiKey").should("have.value", "");
  cy.get("#sendgridFromEmail").should("have.value", "");

  cy.get("#sendgridApiKey").clear().type(apiKey);
  cy.get("#sendgridFromEmail").clear().type(fromEmail);
  cy.get(".inline-flex").click();
  cy.wait(3000);
  cy.reload();
  cy.get(".-mb-px > :nth-child(3)").click();
  cy.get("#sendgridApiKey").should("have.value", apiKey);
  cy.get("#sendgridFromEmail").should("have.value", fromEmail);
};
