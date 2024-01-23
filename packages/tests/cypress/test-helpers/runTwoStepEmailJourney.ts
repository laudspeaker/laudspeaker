// eslint-disable-next-line import/no-extraneous-dependencies
import "@4tw/cypress-drag-drop";
import createNewSegment from "./createNewSegment";
import setupEventTrigger from "./setupEventTrigger";

export default (
  name: string,
  eventName: string,
  flowName = "Email flow",
  fixTrigger = false
) => {
  cy.get('[data-disclosure-link="Journey Builder"]').click();
  cy.wait(100);
  cy.get(".mt-6 > .inline-flex").click();
  cy.get("#name").type(flowName);
  cy.get("#createJourneySubmit").click();
  cy.wait(3000);
  cy.get("#audience > .p-0 > .justify-between").click();
  cy.get("#name").type("Initial");
  cy.contains("Finish later").click();
  cy.wait(1000);
  cy.get(".text-updater").move({ deltaX: 100, deltaY: 100, force: true });
  cy.wait(1000);
  if (fixTrigger) cy.contains("Delete").click();
  cy.wait(3000);
  cy.get("#audience > .p-0 > .justify-between").click();
  cy.get("#name").type("Second");
  cy.contains("Finish later").click();
  cy.get('[data-isprimary]:not([data-isprimary="true"])').move({
    deltaX: 100,
    deltaY: 300,
    force: true,
  });
  cy.wait(1000);
  if (fixTrigger) cy.contains("Delete").click();
  cy.wait(1000);

  cy.get("#email > .p-0 > .justify-between").drag(
    `[data-isprimary]:not([data-isprimary="true"])`,
    { force: true }
  );
  cy.get("#activeJourney").click();
  cy.contains(name).click();
  cy.get("#exportSelectedTemplate").click();
  setupEventTrigger('[data-isprimary="true"]', eventName, eventName);
  cy.get(".triggerOut").drag('[data-isprimary]:not([data-isprimary="true"])', {
    force: true,
  });
  createNewSegment();

  cy.contains("Save").click();
  cy.wait(1000);
  cy.contains("Start").click();
  cy.wait(5000);
};
