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
    cy.wait(1000);
    cy.request({
      method: "POST",
      headers: {
        Authorization: `Api-Key ${apiKey}`,
      },
      url: `${Cypress.env("AxiosURL")}events/job-status/email`,
      body: {
        jobId: body[0]?.jobIds?.[0],
      },
    }).then(({ body }) => {
      expect(body).to.equal("completed");
    });
  });
};
