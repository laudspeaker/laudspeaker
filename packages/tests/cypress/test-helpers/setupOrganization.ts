import "@4tw/cypress-drag-drop";
export const setupOrganization = (name: string, timezone: string) => {
  cy.visit("/");
  cy.wait(1000);
  // Check the URL and conditionally wait
  cy.url().then((url) => {
    if (/\/payment-gate|\/verification/.test(url)) {
      cy.wait(1000); // Wait for 1 second
    }
  });
  cy.url().should("include", "/company-setup");
  cy.get("#organizationName").click().type(name);
  cy.get("#timezone").click().get(`[data-option="${timezone}"]`).click();
  cy.get("#submit").click();
};
