/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */

import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";
import { IEmailTemplate } from "../test-helpers/templatesFunc";

const { userAPIkey, email, password } = credentials.MessageHitUser;

const emailTemplate: IEmailTemplate = {
  name: "TestTemplateForEmailSending",
  subject: "Test email message by cypress. Known tag: {{ email }}",
};

describe(
  "Journey with email triggered",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);

      cy.get("#messaging").click();
      cy.get("#campaigns").click();

      cy.get("#create-template-button").click();
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
      cy.contains(emailTemplate.name).should("exist");
    });
  }
);
