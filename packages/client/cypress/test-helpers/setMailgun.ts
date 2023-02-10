const {
  TESTS_POSTHOG_API_KEY,
  TESTS_POSTHOG_HOST_URL,
  TESTS_POSTHOG_PROJECT_ID,
  TESTS_MAILGUN_API_KEY,
} = Cypress.env();

export default () => {
  cy.get('[data-disclosure-link="Home"]').click();
  cy.contains("Complete onboarding").click();
  cy.get("#email_config_select").click();
  cy.get('[data-option="mailgun"]').click();
  cy.get("#sendingName").clear().type("SendingName");
  cy.get("#sendingEmail").clear().type("SendingEmail");
  cy.get("#privateApiKey").clear().type(TESTS_MAILGUN_API_KEY);
  cy.get("#activeJourney").click();
  cy.get('[data-option^="sandbox"]').click();
  cy.get("#saveEmailConfiguration").click();

  cy.get('[href^="https://slack.com/oauth"]').should("exist");

  // add mock endpoint for this one
  cy.get(":nth-child(2) > .px-6 > .ml-4").click();
  cy.get("#events_config_select").click();
  cy.get('[data-option="posthog"]').click();
  cy.get("#posthogApiKey").clear().type(TESTS_POSTHOG_API_KEY);
  cy.get("#posthogProjectId").clear().type(TESTS_POSTHOG_PROJECT_ID);
  cy.get("#posthogHostUrl").clear().type(TESTS_POSTHOG_HOST_URL);
  cy.get("#posthogSmsKey").clear().type("phoneNumber");
  cy.get("#posthogEmailKey").clear().type("email");
  cy.get(":nth-child(2) > .mt-5 > .bg-gray-50 > .inline-flex").click();

  cy.reload();
  cy.wait(5000);

  cy.get("#sendingName").should("contain.value", "SendingName");
  cy.get("#sendingEmail").should("contain.value", "SendingEmail");
  cy.get("#privateApiKey").should("contain.value", TESTS_MAILGUN_API_KEY);
  cy.get(":nth-child(2) > .px-6 > .ml-4").click();
  cy.get("#posthogApiKey").should("contain.value", TESTS_POSTHOG_API_KEY);
  cy.get("#posthogProjectId").should("contain.value", TESTS_POSTHOG_PROJECT_ID);
  cy.get("#posthogHostUrl").should("contain.value", TESTS_POSTHOG_HOST_URL);
  cy.get("#posthogEmailKey").should("contain.value", "email");
};
