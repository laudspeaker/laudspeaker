// eslint-disable-next-line import/no-extraneous-dependencies
import "@4tw/cypress-drag-drop";
export interface ISlackTemplate {
  name: string;
  message: string;
}

export interface ISMSTemplate {
  name: string;
  message: string;
}

export interface IEmailTemplate {
  name: string;
  subject: string;
}

export const templatesFunc = (
  slackTemplate: ISlackTemplate = {
    name: "TestTemplateForSlackSending",
    message: "Test slack message by cypress. Known tag: {{ email }}",
  },
  emailTemplate: IEmailTemplate = {
    name: "TestTemplateForEmailSending",
    subject: "Test email message by cypress. Known tag: {{ email }}",
  },
  smsTemplate: ISMSTemplate = {
    name: "TestTemplateForSMSSending",
    message: "Test SMS message by cypress. Known tag: {{ email }}",
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
  cy.get("#handleTemplateType").click();
  cy.get("#handleTemplateType").find('[data-option="slack"]').click();
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
  cy.get("#handleTemplateType").click();
  cy.get("#handleTemplateType").find('[data-option="email"]').click();
  cy.get("#submitTemplateCreation").click();
  cy.get('[data-custominput-placeholder="Subject"]').click("left", {
    force: true,
  });
  cy.get("#title")
    .clear()
    .type(emailTemplate.subject, { parseSpecialCharSequences: false });
  cy.get(".gjs-f-text").move({ deltaX: -100 });
  cy.get(".gjs-frame").click();
  cy.get("#saveDraftTemplate").click();
  cy.get("#turnBackFromTemplate").click();
  cy.url().should("include", "/templates");
  cy.get(`[href="templates/email/${emailTemplate.name}"]`).should("exist");

  // create sms template
  cy.get("#createTemplate").click();
  cy.get("#name").clear().type(smsTemplate.name);
  cy.get("#handleTemplateType").click();
  cy.get("#handleTemplateType").find('[data-option="sms"]').click();
  cy.get("#submitTemplateCreation").click();
  cy.url().should("include", `templates/sms/${smsTemplate.name}`);
  cy.get('[data-custominput-placeholder="SMS Message"]').click("left");
  cy.get("#smsMessage")
    .clear()
    .type(smsTemplate.message, { parseSpecialCharSequences: false });
  cy.get("#saveDraftTemplate").click();
  cy.get("#turnBackFromTemplate").click();
  cy.url().should("include", "/templates");
  cy.get(`[href="templates/sms/${smsTemplate.name}"]`).should("exist");
};
