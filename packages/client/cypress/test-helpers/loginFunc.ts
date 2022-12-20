import "@4tw/cypress-drag-drop";
import credentials from "../fixtures/credentials.json";

const { email, password } = credentials;

export const loginFunc = (
  _email: string = email,
  _password: string = password
) => {
  cy.viewport(1280, 1024);
  cy.visit("/");
  cy.clearCookies();
  cy.clearCookies();
  cy.url().should("include", "/login");
  cy.get("#email").type(_email);
  cy.get("#password").type(_password);
  cy.get("#loginIntoAccount").click();
  cy.contains("Active Journeys").should("exist");
};
