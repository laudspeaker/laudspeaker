import uuid from "./uuid";

export default (shouldSave = true, segmentName = String(uuid())) => {
  cy.contains("Next").click();
  cy.get("#segmentName").click();
  cy.contains("Create new").click();
  cy.get("#segmentName").type(segmentName);
  cy.get("#submitSegmentCreate").click();
  if (shouldSave) {
    cy.get("#saveSegmentParams").click();
    cy.wait(3000);
    cy.contains("Next").click();
  }

  return segmentName;
};
