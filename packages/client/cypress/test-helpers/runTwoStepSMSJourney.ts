// eslint-disable-next-line import/no-extraneous-dependencies
import "@4tw/cypress-drag-drop";
import createNewSegment from "./createNewSegment";
import setupEventTrigger from "./setupEventTrigger";

export default (name: string, eventName: string, flowName = "SMS flow") => {
  cy.get('[data-disclosure-link="Journey Builder"]').click();
  cy.wait(100);
  cy.get(".mt-6 > .inline-flex").click();
  cy.get("#name").type(flowName);
  cy.get("#createJourneySubmit").click();
  cy.wait(3000);
  cy.get("#audience > .p-0 > .justify-between").click();
  cy.get("#name").type("Initial");
  cy.get("#saveNewSegment").click();
  cy.contains("Finish later").click();
  cy.get(".text-updater").move({ deltaX: 100, deltaY: 100 });
  cy.get("#audience > .p-0 > .justify-between").click();
  cy.get("#name").type("Second");
  cy.get("#saveNewSegment").click();
  cy.contains("Finish later").click();
  cy.get('[data-isprimary]:not([data-isprimary="true"])').move({
    deltaX: 100,
    deltaY: 300,
  });
  cy.get('[data-isprimary]:not([data-isprimary="true"])').click();
  cy.get("#sms > .p-0 > .justify-between").click();
  cy.get("#activeJourney").click();
  cy.contains(name).click();
  cy.get("#exportSelectedTemplate").click();
  cy.get('[data-isprimary="true"]').click();
  setupEventTrigger(eventName, eventName);
  cy.get(".triggerOut").drag('[data-isprimary]:not([data-isprimary="true"])', {
    force: true,
  });
  cy.get('[data-isprimary]:not([data-isprimary="true"])').click();

  createNewSegment();

  cy.contains("Save").click();
  cy.wait(1000);
  cy.contains("Start").click();
  cy.wait(3000);
};
