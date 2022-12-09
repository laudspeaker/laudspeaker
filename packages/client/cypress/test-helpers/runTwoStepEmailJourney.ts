import setupEventTrigger from "./setupEventTrigger";

export default (name: string, eventName: string) => {
  cy.get('[data-disclosure-link="Journey Builder"]').click();
  cy.get(".mt-6 > .inline-flex").click();
  cy.get("#name").type("Email flow");
  cy.get("#createJourneySubmit").click();
  cy.wait(3000);
  cy.get("#audience > .p-0 > .justify-between").click();
  cy.get("#name").type("Initial");
  cy.get("#saveNewSegment").click();
  cy.get(".text-updater").move({ deltaX: 100, deltaY: 100 });
  cy.get("#audience > .p-0 > .justify-between").click();
  cy.get("#name").type("Second");
  cy.get("#saveNewSegment").click();
  cy.get('[data-isprimary]:not([data-isprimary="true"])').move({
    deltaX: 100,
    deltaY: 300,
  });
  cy.get('[data-isprimary]:not([data-isprimary="true"])').click();
  cy.get("#email > .p-0 > .justify-between").click();
  cy.get("#activeJourney").click();
  cy.contains(name).click();
  cy.get("#exportSelectedTemplate").click();
  cy.get('[data-isprimary="true"]').click();
  setupEventTrigger(eventName, eventName);
  cy.get(
    '[style="display: flex; height: 15px; position: absolute; left: 0px; bottom: 0px; align-items: center; width: 100%; justify-content: space-around;"] > .react-flow__handle'
  ).drag('[data-isprimary]:not([data-isprimary="true"])', { force: true });
  cy.get('[data-isprimary]:not([data-isprimary="true"])').click();
  cy.contains("Save").click();
  cy.wait(1000);
  cy.contains("Start").click();
  cy.wait(3000);
};
