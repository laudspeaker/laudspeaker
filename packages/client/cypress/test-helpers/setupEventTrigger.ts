import "@4tw/cypress-drag-drop";
export default (selector: string, key: string, value: string) => {
  cy.wait(3000);
  cy.contains("Event Based").drag(selector, { force: true });
  cy.contains("Add new condition").click();
  cy.get("#keyInput").clear().type(key);
  cy.get(".h-8").click();
  cy.wait(1000);
  cy.get("#keyType").click();
  cy.contains("String").click();
  cy.get("#comparisonType").click();
  cy.contains("is equal to").click();
  cy.get("#dynamicInput").clear().type(value);
  cy.get('[data-savetriggerreator="true"] > .inline-flex').click();
};
