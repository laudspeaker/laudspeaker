import uuid from "./uuid";

export default (shouldSave = true, segmentName = String(uuid())) => {
  cy.contains("Define segment").click();
  cy.get("#segmentName").click();
  cy.contains("Create new").click();
  cy.get("#segmentName").type(segmentName);
  cy.get("#submitSegmentCreate").click();
  if (shouldSave) {
    cy.get("#saveSegmentParams").click();
  }

  return segmentName;
};
