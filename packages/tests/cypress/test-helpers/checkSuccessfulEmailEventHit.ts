import "@4tw/cypress-drag-drop";
export default (
  apiKey: string,
  eventName: string,
  correlationKey: string,
  correlationValue: string,
  callback?: () => void
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
    cy.wait(5000);
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
      if (callback) callback();
    });
  });
};
