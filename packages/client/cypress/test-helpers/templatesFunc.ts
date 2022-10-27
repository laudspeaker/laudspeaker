export const tamplatesFunc = () => {
  cy.reload();

  cy.get('[aria-expanded="false"]')
    .find('[data-disclosure="Messaging"]')
    .click();

  // create slack template
  cy.get('[data-disclosure-link="Template Builder"]').click();
  cy.url().should("include", "/templates");
  cy.get("#createTemplate").click();
  cy.get("#name").clear().type("With slack");
  cy.get("#handleDay").click();
  cy.get("#handleDay").find('[data-option="slack"]').click();
  cy.get("#submitTemplateCreation").click();
  cy.url().should("include", "templates/slack/With%20slack");
  cy.get('[data-custominput-placeholder="Slack Message"]').click("left");
  cy.get("#slackMessage")
    .clear()
    .type("Slack message, and longer text, tag {{}{{} newTag }}");
  cy.get("#saveDraftTemplate").click();
  cy.get("#turnBackFromTemplate").click();
  cy.url().should("include", "/templates");
  cy.get('[href="templates/slack/With slack"]').should("exist");

  // create email template
  cy.get("#createTemplate").click();
  cy.get("#name").clear().type("With email");
  cy.get("#handleDay").click();
  cy.get("#handleDay").find('[data-option="email"]').click();
  cy.get("#submitTemplateCreation").click();
  cy.get('[data-custominput-placeholder="Subject"]').click("left");
  cy.get("#title")
    .clear()
    .type("Subject of email, and longer text,tag {{}{{} newTag }}");
  cy.get(".gjs-f-text").move({ deltaX: -100 });
  cy.get(".gjs-frame").click();
  cy.get("#saveDraftTemplate").click();
  cy.get("#turnBackFromTemplate").click();
  cy.url().should("include", "/templates");
  cy.get('[href="templates/email/With email"]').should("exist");
};
