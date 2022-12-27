import "@4tw/cypress-drag-drop";
export default (
  apiKey: string,
  eventName: string,
  correlationKey: string,
  correlationValue: string
) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("AxiosURL")}events`,
    headers: {
      Authorization: `Api-Key ${apiKey}`,
    },
    body: {
      correlationKey,
      correlationValue,
      event: { [eventName]: eventName },
    },
  }).then(({ body }) => {
    expect(body?.[0]?.jobIds?.[0]).to.equal(undefined);
  });
};
