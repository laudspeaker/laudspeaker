// eslint-disable-next-line import/no-extraneous-dependencies
import "@4tw/cypress-drag-drop";
import createNewSegment from "./createNewSegment";
export default (
  JourneyName = "Single step firebase flow",
  templateName = "TestTemplateForFirebase"
) => {
  cy.wait(3000);
  cy.get('[data-disclosure-link="Journey Builder"]').click();
  cy.wait(3000);
  cy.get("button").contains("Create Journey").click();
  cy.get("#name").should("exist").type(JourneyName);
  cy.get("#createJourneySubmit").click();
  cy.wait(3000);
  cy.get("#audience > .p-0 > .justify-between").click();
  cy.get("#name").type("init");
  cy.get("#description").type("init description text");
  cy.contains("Finish later").click();

  cy.get(".react-flow__viewport")
    .get('[data-isprimary="true"]')
    .move({ deltaX: 100, deltaY: 100 });
  cy.wait(3000);
  cy.get("#firebase").drag('[data-isprimary="true"]', { force: true });
  cy.get("#activeJourney").click();
  cy.contains(templateName).click();
  cy.wait(3000);
  cy.get("#exportSelectedTemplate").click();

  createNewSegment();

  cy.contains("Save").click();
  cy.contains("Start").click();
};
