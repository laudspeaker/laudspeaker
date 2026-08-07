export const setPrimaryKey = (attribute: string) => {
    cy.contains("Audience").click();
    cy.contains("People").click();
    cy.get(':contains("Settings"):last').click();
    cy.contains("Select which customer attribute to use as the primary key").click();
    cy.contains(attribute).click();
    cy.wait(1000);
    cy.contains("Save").click();
    cy.wait(1000);
    cy.contains("Primary Key Updated!").should("exist");
    cy.wait(1000);
  };
  