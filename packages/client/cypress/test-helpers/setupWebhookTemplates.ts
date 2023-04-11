export default () => {
  cy.reload();

  cy.get('[aria-expanded="false"]')
    .find('[data-disclosure="Messaging"]')
    .click();

  cy.get('[data-disclosure-link="Template Builder"]').click();
  cy.url().should("include", "/templates");
  cy.get("#createTemplate").click();

  cy.get("#name").clear().type("webhook1");
  cy.get("#handleTemplateType").click();
  cy.get("#handleTemplateType").find('[data-option="webhook"]').click();
  cy.get("#submitTemplateCreation").click();
  cy.get("#webhookURL").click();
  cy.get(".relative > #webhookURL")
    .clear()
    .type("https://jsonplaceholder.typicode.com/posts");
  cy.get("#saveDraftTemplate").click();

  cy.get('[data-disclosure-link="Template Builder"]').click();
  cy.url().should("include", "/templates");
  cy.get("#createTemplate").click();

  cy.get("#name").clear().type("webhook2");
  cy.get("#handleTemplateType").click();
  cy.get("#handleTemplateType").find('[data-option="webhook"]').click();
  cy.get("#submitTemplateCreation").click();
  cy.get("#webhookURL").click();
  cy.wait(1000);
  cy.get(".relative > #webhookURL")
    .clear()
    .type("https://jsonplaceholder.typicode.com/posts");
  cy.contains("GET").click();
  cy.get("#data-option-POST").click();
  cy.get(".-mb-px > :nth-child(2)").click();
  cy.get("#webhook-body").click();
  cy.get(".relative #webhook-body:nth(1)")
    .clear()
    .type(
      `{
  "title": "foo",
  "body": "bar",
  "userId": "{{ email }}",
  "templatesExample": "[[ email;example-template-review;subject ]]"
}`,
      { parseSpecialCharSequences: false }
    );
  cy.get("#saveDraftTemplate").click();

  cy.get('[data-disclosure-link="Template Builder"]').click();
  cy.url().should("include", "/templates");
  cy.get("#createTemplate").click();

  cy.get("#name").clear().type("webhook3");
  cy.get("#handleTemplateType").click();
  cy.get("#handleTemplateType").find('[data-option="webhook"]').click();
  cy.get("#submitTemplateCreation").click();
  cy.get("#webhookURL").click();
  cy.get(".relative > #webhookURL")
    .clear()
    .type("https://www.random-site-asf%safi14148ad.com");
  cy.get("#saveDraftTemplate").click();
};
