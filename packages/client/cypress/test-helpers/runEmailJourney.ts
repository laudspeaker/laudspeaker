export default (JourneyName = "Single step flow") => {
  cy.get('[data-disclosure-link="Journey Builder"]').click();
  cy.wait(3000);
  cy.get("button").contains("Create Journey").click();
  cy.get("#name").should("exist").type(JourneyName);
  cy.get("#createJourneySubmit").click();
  cy.wait(1000);
  cy.get("#audience > .p-0 > .justify-between").click();
  cy.get("#name").type("init");
  cy.get("#description").type("init description text");
  cy.get("#saveNewSegment").click();

  cy.get(".react-flow__viewport")
    .get('[data-isprimary="true"]')
    .move({ deltaX: 100, deltaY: 100 })
    .click();
  cy.get("#email").click();
  cy.get("#activeJourney").click();
  cy.contains("TestTemplate").click();
  cy.get("#exportSelectedTemplate").click();

  cy.contains("Save").click();
  cy.contains("Start").click();
};
