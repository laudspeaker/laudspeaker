export default (
  backendURL: string,
  apiKey: string,
  body?: Cypress.RequestBody
) =>
  cy.request({
    method: "POST",
    url: `${backendURL}/events`,
    headers: { Authorization: `Api-Key ${apiKey}` },
    body,
  });
