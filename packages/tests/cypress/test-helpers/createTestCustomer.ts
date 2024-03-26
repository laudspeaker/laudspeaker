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

  cy.contains("Add attribute").click();
  cy.get("input:last").clear().type("num");
  cy.contains("String").click();
  cy.get('[data-option="Number"]').click();

  cy.contains("Add attribute").click();
  cy.get("input:last").clear().type("str");

  cy.contains("Add attribute").click();
  cy.get("input:last").clear().type("numarr");
  cy.get(":contains(String):last").click();
  cy.get('[data-option="Array"]').click();
  cy.get(":contains(String):last").click();
  cy.get('[data-option="Number"]').click();

  cy.contains("Add attribute").click();
  cy.get("input:last").clear().type("date");
  cy.get(":contains(String):last").click();
  cy.get('[data-option="Date"]').click();
  cy.contains("Select date format").click();
  cy.get('[data-option="MM-dd-yy"]').click();

  cy.contains("Save").click();

  cy.get("#create-customer-button").click();
  cy.get("#pkValue").type(email);
  cy.get("#create-person-modal-button").click();
};
