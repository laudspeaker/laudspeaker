export default (
  dragSourceSelector: string,
  dragTargetSelector: string,
  options: { fireDragOver: boolean } = { fireDragOver: true }
) => {
  const { fireDragOver } = options;

  const dataTransfer = new DataTransfer();
  cy.get(dragSourceSelector).trigger("dragstart", {
    dataTransfer,
    force: true,
  });
  cy.get(dragTargetSelector).trigger("drag", {
    dataTransfer,
    force: true,
  });
  if (fireDragOver) {
    cy.get(dragTargetSelector).trigger("dragover", {
      dataTransfer,
      force: true,
    });
  }
  cy.get(dragTargetSelector).trigger("drop", {
    dataTransfer,
    force: true,
  });
  cy.get(dragSourceSelector).trigger("dragend", {
    dataTransfer,
    force: true,
  });
};
