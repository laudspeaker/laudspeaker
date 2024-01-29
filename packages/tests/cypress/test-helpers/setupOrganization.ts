import "@4tw/cypress-drag-drop";
export const setupOrganization = (
  name: string,
  timezone: string,
) => {
  cy.visit("/");
  cy.url().should("include", "/company-setup");
  cy.get("#name").click().type(name);
  cy.get("#timezone").type(timezone);
  cy.get(":nth-child(5) > div > .flex").click();
};
