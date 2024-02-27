import "@4tw/cypress-drag-drop";
export const uploadCSV = (filename: string) => {
  cy.visit("/people");
  //cy.url().should("include", "/company-setup");
  cy.get("div.justify-between button:nth-of-type(2)").click();
  cy.get("div:nth-of-type(1) > p").click();
  cy.get("#dropzone-file").type("C:\\fakepath\\correctness_testing.csv");
  cy.get("button.bg-\\[\\#6366F1\\]").click();
};
