import uuid from "./uuid";

export default (shouldSave = true, segmentName = String(uuid())) => {
  cy.contains("Next").click();
  if (shouldSave) {
    cy.get("#saveSegmentParams").click();
    cy.wait(3000);
    cy.contains("Save").click();
  }

  return segmentName;
};
