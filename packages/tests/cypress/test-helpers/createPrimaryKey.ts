export const createPrimaryKey = (attribute: string, attribute_type: string = "String") => {
  cy.contains("Audience").click();
  cy.contains("People").click();

  cy.get(':contains("Settings"):last').click();
  cy.contains("Add attribute").click();
  cy.get("input").clear().type(attribute);
  cy.contains(attribute_type).click();
  cy.get(`[data-option="${attribute_type}"]`).click();
  cy.contains("Select which customer attribute to use as the primary key").click();
  cy.contains(attribute).click();

  cy.wait(1000);

  cy.contains("Save").click();

  cy.wait(1000);

  cy.contains("Primary Key Updated!").should("exist");
  
  cy.wait(1000);
};
