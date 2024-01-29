import "@4tw/cypress-drag-drop";


export const loginFunc = (
  _email: string,
  _password: string,
) => {
  cy.viewport(1280, 1024);
  cy.visit("/");
  cy.clearCookies();
  cy.clearCookies();
  cy.url().should("include", "/login");
  cy.get("#email").type(_email);
  cy.get("#password").type(_password);
  cy.get("#loginIntoAccount").click();
};
