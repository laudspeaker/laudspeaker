import uuid from "./uuid";

export default (shouldSave = true, segmentName = String(uuid())) => {
  cy.get("#createNewSegment").click();
  cy.get("#newSegmentName").type(segmentName);
  cy.get("#submitSegmentCreate").click();
  if (shouldSave) {
    cy.get("#saveSegmentParams").click();
  }

  return segmentName;
};
