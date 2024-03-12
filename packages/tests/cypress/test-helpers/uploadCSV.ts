import "@4tw/cypress-drag-drop";
export const uploadCSV = (filename: string) => {
  cy.visit("/people");
  //cy.url().should("include", "/company-setup");
  cy.get("div.justify-between button:nth-of-type(2)").click();
  cy.get("div:nth-of-type(1) > p").click();

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
  cy.get("#next-button").click();
};
