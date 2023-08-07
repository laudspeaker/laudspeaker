export default (dragSourceSelector: string, dragTargetSelector: string) => {
  const dataTransfer = new DataTransfer();
  cy.get(dragSourceSelector).trigger("dragstart", {
    dataTransfer,
  });
  cy.get(dragTargetSelector).trigger("drag", {
    dataTransfer,
  });
  cy.get(dragTargetSelector).trigger("dragover", {
    dataTransfer,
  });
  cy.get(dragTargetSelector).trigger("drop", {
    dataTransfer,
  });
  cy.get(dragSourceSelector).trigger("dragend", {
    dataTransfer,
  });
};
