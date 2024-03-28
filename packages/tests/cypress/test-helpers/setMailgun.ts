const { TESTS_MAILGUN_API_KEY } = Cypress.env();

export default () => {
  cy.contains("Settings").click();
  cy.contains("Message Channels").click();
  cy.get("#email").click();
  cy.get("#mailgun-api-key-input").clear().type(TESTS_MAILGUN_API_KEY);
  cy.wait(2000);
  cy.get("#mailgun-domain-select").click();
  cy.get('[data-option="laudspeaker-test.com"]').click();
  cy.get("#mailgun-sending-name-input").clear().type("test");
  cy.get("#mailgun-sending-email-input").clear().type("test");
  cy.get("#save-email-settings-button").click();
  cy.contains("Message Channels").click();
  cy.contains("Connected channels").should("exist");
};
