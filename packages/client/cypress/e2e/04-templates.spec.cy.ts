import credentials from "../fixtures/credentials.json";

const { email, password } = credentials;

describe("templates", () => {
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
    cy.reload();

    cy.get('[aria-expanded="false"]')
      .find('[data-disclosure="Messaging"]')
      .click();

    // create slack template
    cy.get('[data-disclosure-link="Template Builder"]').click();
    cy.url().should("include", "/templates");
    cy.get("#createTemplate").click();
    cy.get("#name").type("With slack");
    cy.get("#handleDay").click();
    cy.get("#handleDay").find('[data-option="slack"]').click();
    cy.get("#submitTemplateCreation").click();
    cy.url().should("include", "templates/slack/With%20slack");
    cy.get('[data-custominput-placeholder="Slack Message"]').click();
    cy.get("#slackMessage").type("Slack message, tag {{}{{} newTag }}");
    cy.get("#saveDraftTemplate").click();
    cy.get("#turnBackFromTemplate").click();
    cy.url().should("include", "/templates");
    cy.get('[href="templates/slack/With slack"]').should("exist");

    // create email template
    cy.get("#createTemplate").click();
    cy.get("#name").type("With email");
    cy.get("#handleDay").click();
    cy.get("#handleDay").find('[data-option="email"]').click();
    cy.get("#submitTemplateCreation").click();
    cy.get('[data-custominput-placeholder="Subject"]').click();
    cy.get("#title").type("Subject of email {{}{{} newTag }}");
    cy.get("#saveDraftTemplate").click();
    cy.get("#turnBackFromTemplate").click();
    cy.url().should("include", "/templates");
    cy.get('[href="templates/email/With email"]').should("exist");
  });
});
