import "@4tw/cypress-drag-drop";
export const uploadCSV = (filename: string) => {
  cy.visit("/people");

  cy.get("[data-testid='import-customer-button']", { timeout: 10000 }).click({
    force: true,
  });

  cy.get("#dropzone-file").selectFile(
    {
      // path relative to the cypress configuration file
      contents: `cypress/fixtures/${filename}`,
    },
    {
      // input element is hidden, so we need to force the upload
      force: true,
    }
  );

  cy.get("[data-testid='import-file-name']", { timeout: 10000 }).should(
    "be.visible"
  );

  cy.get("[data-testid='next-button']").click({ force: true });
};
