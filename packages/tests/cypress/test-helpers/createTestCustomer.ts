export default (email: string) => {
  cy.contains("Audience").click();
  cy.contains("People").click();
  cy.get(':contains("Settings"):last').click();
  cy.contains("Add attribute").click();
  cy.get("input").clear().type("email");
  cy.contains("String").click();
  cy.get('[data-option="Email"]').click();
  cy.contains("Select user attribute").click();
  cy.contains("email").click();
  cy.contains("Add attribute").click();
  cy.get("input:last").clear().type("agreed");
  cy.contains("String").click();
  cy.get('[data-option="Boolean"]').click();

  cy.contains("Add attribute").click();
  cy.get("input:last").clear().type("mkt_agree");
  cy.contains("String").click();
  cy.get('[data-option="Boolean"]').click();
  cy.contains("Save").click();

  cy.get("#create-customer-button").click();
  cy.get("#pkValue").type(email);
  cy.get("#create-person-modal-button").click();
};
