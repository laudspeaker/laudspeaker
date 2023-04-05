import createNewSegment from "./createNewSegment";
import setupEventTrigger from "./setupEventTrigger";

export default (templateName = "webhook1", fixTrigger = false) => {
  cy.get('[data-disclosure-link="Journey Builder"]').click();
  cy.wait(100);
  cy.get(".mt-6 > .inline-flex").click();
  cy.get("#name").type("Webhook test");
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

  cy.get("#webhook > .p-0 > .justify-between").drag(
    `[data-isprimary]:not([data-isprimary="true"])`,
    { force: true }
  );
  cy.get(`[data-isprimary]:not([data-isprimary="true"])`).click();
  cy.get("#saveNewSegment").click();

  cy.get("#activeJourney").click();
  cy.contains(templateName).click();
  cy.get("#exportSelectedTemplate").click();

  setupEventTrigger('[data-isprimary="true"]', "wh", "wh");
  cy.get(".triggerOut").drag('[data-isprimary]:not([data-isprimary="true"])', {
    force: true,
  });
  cy.get('[data-isprimary]:not([data-isprimary="true"])').click();
  createNewSegment();

  cy.contains("Save").click();
  cy.wait(1000);
  cy.contains("Start").click();
  cy.wait(5000);
};
