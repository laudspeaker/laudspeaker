import "@4tw/cypress-drag-drop";

export const uploadCSV = (filename: string) => {
  cy.visit("/people");

  cy.get("#import-customer-button", { timeout: 40000 }).click({
    force: true,
  });

  cy.get("#dropzone-file", { timeout: 40000 }).selectFile(
    {
      // path relative to the cypress configuration file
      contents: `cypress/fixtures/${filename}`,
    },
    {
      // input element is hidden, so we need to force the upload
      force: true,
    }
  );

  cy.get("#import-file-name", { timeout: 80000 }).should("be.visible");

  cy.get("#next-button").click({ force: true });
};
