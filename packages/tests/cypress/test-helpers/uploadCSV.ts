import "@4tw/cypress-drag-drop";
export const uploadCSV = (
  filename: string,
) => {
  cy.visit("/");
  cy.url().should("include", "/company-setup");
  cy.get("#organizationName").click().type(filename);
  cy.get("#timezone").click().get('[data-option="UTC+00:00"]').click();
  cy.get('#submit').click()
};
