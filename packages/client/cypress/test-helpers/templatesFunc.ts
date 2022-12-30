import "@4tw/cypress-drag-drop";
export interface ISlackTemplate {
  name: string;
  message: string;
}

export interface IEmailTemplate {
  name: string;
  subject: string;
}

export const tamplatesFunc = (
  slackTemplate: ISlackTemplate = {
    name: "TestTemplateForSlackSending",
    message:
      "Test slack message by cypress. Unknown tag: {{ randomText }}, known tag: {{ slackEmail }}",
  },
  emailTemplate: IEmailTemplate = {
    name: "TestTemplateForEmailSending",
    subject:
      "Test email message by cypress. Unknown tag: {{ randomText }}, known tag: {{ slackEmail }}",
  }
) => {
  cy.reload();

  cy.get('[aria-expanded="false"]')
    .find('[data-disclosure="Messaging"]')
    .click();

  // create slack template
  cy.get('[data-disclosure-link="Template Builder"]').click();
  cy.url().should("include", "/templates");
  cy.get("#createTemplate").click();
  cy.get("#name").clear().type(slackTemplate.name);
  cy.get("#handleDay").click();
  cy.get("#handleDay").find('[data-option="slack"]').click();
  cy.get("#submitTemplateCreation").click();
  cy.url().should("include", `templates/slack/${slackTemplate.name}`);
  cy.get('[data-custominput-placeholder="Slack Message"]').click("left");
  cy.get("#slackMessage")
    .clear()
    .type(slackTemplate.message, { parseSpecialCharSequences: false });
  cy.get("#saveDraftTemplate").click();
  cy.get("#turnBackFromTemplate").click();
  cy.url().should("include", "/templates");
  cy.get(`[href="templates/slack/${slackTemplate.name}"]`).should("exist");

  // create email template
  cy.get("#createTemplate").click();
  cy.get("#name").clear().type(emailTemplate.name);
  cy.get("#handleDay").click();
  cy.get("#handleDay").find('[data-option="email"]').click();
  cy.get("#submitTemplateCreation").click();
  cy.get('[data-custominput-placeholder="Subject"]').click("left");
  cy.get("#title")
    .clear()
    .type(emailTemplate.subject, { parseSpecialCharSequences: false });
  cy.get(".gjs-f-text").move({ deltaX: -100 });
  cy.get(".gjs-frame").click();
  cy.get("#saveDraftTemplate").click();
  cy.get("#turnBackFromTemplate").click();
  cy.url().should("include", "/templates");
  cy.get(`[href="templates/email/${emailTemplate.name}"]`).should("exist");
};
