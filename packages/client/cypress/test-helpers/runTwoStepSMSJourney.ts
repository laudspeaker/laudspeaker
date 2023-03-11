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
  cy.contains("Finish later").click();
  cy.wait(1000);
  cy.get(".text-updater").move({ deltaX: 100, deltaY: 100, force: true });
  cy.wait(3000);
  cy.get("#audience > .p-0 > .justify-between").click();
  cy.get("#name").type("Second");
  cy.contains("Finish later").click();
  cy.wait(1000);
  cy.get('[data-isprimary]:not([data-isprimary="true"])').move({
    deltaX: 100,
    deltaY: 300,
  });
  cy.wait(1000);
  cy.contains("Save").click();
  cy.wait(1000);
  cy.get("#sms > .p-0 > .justify-between").drag(
    '[data-isprimary]:not([data-isprimary="true"])',
    { force: true }
  );
  cy.wait(1000);
  cy.get("#activeJourney").click();
  cy.contains(name).click();
  cy.get("#exportSelectedTemplate").click();
  setupEventTrigger('[data-isprimary="true"]', eventName, eventName);
  cy.wait(1000);
  cy.get(".triggerOut").drag('[data-isprimary]:not([data-isprimary="true"])', {
    force: true,
  });
  cy.wait(1000);
  cy.get('[data-isprimary]:not([data-isprimary="true"])').click();

  createNewSegment();

  cy.contains("Save").click();
  cy.wait(1000);
  cy.contains("Start").click();
  cy.wait(3000);
};
