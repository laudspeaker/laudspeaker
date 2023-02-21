import "@4tw/cypress-drag-drop";
export default (key: string, value: string) => {
  cy.wait(3000);
  cy.contains("Event Based").click();
  cy.contains("Add new condition").click();
  cy.get("#keyInput").clear().type(key);
  cy.get(".h-8").click();
  cy.get("#keyType").click();
  cy.contains("String").click();
  cy.get("#comparisonType").click();
  cy.contains("is equal to").click();
  cy.get("#dynamicInput").clear().type(value);
  cy.get('[data-savetriggerreator="true"] > .inline-flex').click();
};
