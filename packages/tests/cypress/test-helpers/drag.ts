export default (
  dragSourceSelector: string,
  dragTargetSelector: string,
  options: { fireDragOver: boolean } = { fireDragOver: true }
) => {
  const { fireDragOver } = options;

  const dataTransfer = new DataTransfer();
  cy.get(dragSourceSelector).trigger("dragstart", {
    dataTransfer,
  });
  cy.get(dragTargetSelector).trigger("drag", {
    dataTransfer,
  });
  if (fireDragOver) {
    cy.get(dragTargetSelector).trigger("dragover", {
      dataTransfer,
    });
  }
  cy.get(dragTargetSelector).trigger("drop", {
    dataTransfer,
  });
  cy.get(dragSourceSelector).trigger("dragend", {
    dataTransfer,
  });
};
