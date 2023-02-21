export default () => {
  cy.wait(1000);
  cy.get("#timeDelay > .p-0 > .justify-between").click();
  cy.get(".max-h-full button:nth(1)").click();
  cy.get("#data-option-Delay").click();
  cy.get("#delayTime").clear().type("00:01");
  cy.get("#save-trigger").click();
};
