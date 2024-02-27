import "@4tw/cypress-drag-drop";
export const setupOrganization = (name: string, timezone: string) => {
  cy.visit("/");
  cy.url().should("include", "/company-setup");
  cy.get("#organizationName").click().type(name);
  cy.get("#timezone").click().get(`[data-option="${timezone}"]`).click();
  cy.get("#submit").click();
};
