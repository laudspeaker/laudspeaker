import credentials from "../fixtures/credentials.json";

const { email, password, APIkey } = credentials;

describe("onboarding", () => {
  it("passes", () => {
    cy.viewport(1280, 1024);
    cy.visit("/");
    cy.clearCookies();
    cy.clearCookies();
    cy.url().should("include", "/login");
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.get("#loginIntoAccount").click();
    cy.contains("Active Journeys").should("exist");

    cy.get('[data-disclosure-link="Home"]').click();
    cy.get("#email_config_select").click();
    cy.get('[data-option="mailgun"]').click();
    cy.get("#sendingName").clear().type("SendingName");
    cy.get("#sendingEmail").clear().type("SendingEmail");
    cy.get("#privateApiKey")
      .clear()
      .type("e52ef0112c0c7394b273ba3d3e25474c-4dd50799-4a315eeb");
    cy.get("#activeJourney").click();
    cy.get('[data-option^="sandbox"]').click();
    cy.get("#saveEmailConfiguration").click();

    cy.get('[href^="https://slack.com/oauth"]').should("exist");

    // add mock endpoint for this one
    // cy.get("#events_config_select").click();
    // cy.get('[data-option="posthog"]').click();
    // cy.get("#posthogApiKey").type(
    //   "test-value-key-test-value-key-test-value-key"
    // );
    // cy.get("#posthogProjectId").type("2707");
    // cy.get("#posthogHostUrl").type("app.posthog.com");
    // cy.get("#posthogSmsKey").type("phoneNumber");
    // cy.get("#posthogEmailKey").type("email");
  });
});
