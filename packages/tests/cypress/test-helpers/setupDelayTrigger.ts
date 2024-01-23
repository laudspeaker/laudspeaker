export default (selector: string) => {
  cy.wait(1000);
  cy.get("#timeDelay > .p-0 > .justify-between").drag(selector, {
    force: true,
  });
  cy.get("#minutes").clear().type("1");
  cy.get("#hours").clear();
  cy.get("#save-trigger").click();
};
