export default () => {
  cy.get("#timeDelay > .p-0 > .justify-between").click();
  cy.get(".MuiFormControl-root button").click();
  cy.get("#data-option-Delay").click();
  cy.get("#delayTime").clear().type("00:01");
  cy.get("#save-trigger").click();
};
