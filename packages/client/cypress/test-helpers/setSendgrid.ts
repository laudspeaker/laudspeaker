import "@4tw/cypress-drag-drop";
import setFree3 from "./setFree3";

export default (apiKey: string, fromEmail: string) => {
  setFree3();
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
