import credentials from "../fixtures/credentials";
const { segments } = credentials;

export const createManualSegment = () => {
  cy.get('[data-disclosure="Audience"]').click();
  cy.get('[data-disclosure-link="Segments"]').click();
  cy.get("#createTemplate").click();
  cy.get("#name").type(segments.manual.name);
  cy.get("#description").type(segments.manual.description);
  cy.contains("automatic").click();
  cy.get("#data-option-manual > :nth-child(1) > div").click();
  cy.get("#submitTemplateCreation").click();
  cy.get("#dropzone-file").selectFile(
    {
      contents: "cypress/fixtures/3-customers-for-segemnt.csv",
    },
    {
      force: true,
    }
  );
  cy.get(".min-w-full > .divide-y >").should("have.length", 3);
};
