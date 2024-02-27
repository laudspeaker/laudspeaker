import "@4tw/cypress-drag-drop";
export const sendPassword = (email: string) => {
  cy.clearCookies();
  cy.visit("/");
  cy.url().should("include", "/login");
  cy.get('[href="/reset-password"]').click();
  cy.url().should("include", "/reset-password");
  cy.get("#firstName").click().type(email);
  cy.get(":nth-child(5) > div > .flex").click();
};
