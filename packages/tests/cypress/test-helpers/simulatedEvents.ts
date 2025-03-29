import "@4tw/cypress-drag-drop";
export const simulatedEvents = (
    url: string,
    key: string,
    body: any,
) => {
  cy.request({
    method: "POST",
    url,
    headers: {
      Authorization: `Api-Key ${key}`,
      'Content-Type': 'application/json'
    },
    body,
  })
};
