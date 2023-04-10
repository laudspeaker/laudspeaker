/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";
import runEmailJourney from "../test-helpers/runEmailJourney";
import runFirebaseJourney from "../test-helpers/runFirebaseJourney";
import runSlackJourney from "../test-helpers/runSlackJourney";
import runSmsJourney from "../test-helpers/runSmsJourney";
import setFirebase from "../test-helpers/setFirebase";
import setupWebhookTemplates from "../test-helpers/setupWebhookTemplates";
import startWebhookJouney from "../test-helpers/startWebhookJouney";

const apiCallTagToInsert =
  "[{[ ewogICAgInVybCI6ICJodHRwczovL2pzb25wbGFjZWhvbGRlci50eXBpY29kZS5jb20vcG9zdHMiLAogICAgImJvZHkiOiAie1xuICBcIkFcIjogXCJBXCJcbn0iLAogICAgIm1ldGhvZCI6ICJQT1NUIiwKICAgICJoZWFkZXJzIjogewogICAgICAgICJBIjogIkIiCiAgICB9LAogICAgInJldHJpZXMiOiA1LAogICAgImZhbGxCYWNrQWN0aW9uIjogMAp9;response.data.id ]}]";

const { email, password, emailTemplate, userAPIkey } =
  credentials.MessageHitUser;

describe("Api calls", { env: { AxiosURL: "http://localhost:3001/" } }, () => {
  beforeEach(() => {
    cy.request("http://localhost:3001/tests/reset-tests");
    cy.wait(1000);
  });

  it("passes for email", () => {
    loginFunc(email, password);

    cy.contains("Messaging").click();
    cy.get('[data-disclosure-link="Template Builder"]').click();
    cy.get("#createTemplate").click();
    cy.get("#name").clear().type("ApiCallsEmail");
    cy.get("#handleTemplateType").click();
    cy.get("#handleTemplateType").find('[data-option="email"]').click();
    cy.get("#submitTemplateCreation").click();
    cy.get('[data-custominput-placeholder="Subject"]').click({
      force: true,
    });
    cy.wait(1000);
    cy.get(":nth-child(1) > :nth-child(2) > .relative > #title")
      .clear()
      .type(apiCallTagToInsert, { parseSpecialCharSequences: false });
    cy.get("#saveDraftTemplate").click();
    cy.wait(1000);
    cy.reload();
    cy.contains("response.data.id").click();
    cy.contains("Host: jsonplaceholder.typicode.com").should("exist");
    cy.get(".h-8").click({ force: true });

    runEmailJourney("Api calls email test", "ApiCallsEmail");
    cy.wait(5000);
    cy.reload();
    cy.get(".justify-between > :nth-child(1) > .font-medium").then((el) => {
      expect(Number(el.text())).to.be.greaterThan(0);
    });
  });

  it("passes for slack", () => {
    loginFunc(email, password);

    cy.contains("Messaging").click();
    cy.get('[data-disclosure-link="Template Builder"]').click();
    cy.url().should("include", "/templates");
    cy.get("#createTemplate").click();
    cy.get("#name").clear().type("ApiCallsSlack");
    cy.get("#handleTemplateType").click();
    cy.get("#handleTemplateType").find('[data-option="slack"]').click();
    cy.get("#submitTemplateCreation").click();
    cy.get('[data-custominput-placeholder="Slack Message"]').click("left");
    cy.get(".relative > #slackMessage")
      .clear({ force: true })
      .type(apiCallTagToInsert, { parseSpecialCharSequences: false });
    cy.get("#saveDraftTemplate").click();
    runSlackJourney("Api calls slack test", "ApiCallsSlack");
  });

  it("passes for sms", () => {
    loginFunc(email, password);

    cy.contains("Messaging").click();
    cy.get('[data-disclosure-link="Template Builder"]').click();
    cy.url().should("include", "/templates");
    cy.get("#createTemplate").click();
    cy.get("#name").clear().type("ApiCallsSms");
    cy.get("#handleTemplateType").click();
    cy.get("#handleTemplateType").find('[data-option="sms"]').click();
    cy.get("#submitTemplateCreation").click();
    cy.get('[data-custominput-placeholder="SMS Message"]').click("left");
    cy.get(".relative > #smsMessage")
      .clear()
      .type(apiCallTagToInsert, { parseSpecialCharSequences: false });
    cy.get("#saveDraftTemplate").click();
    runSmsJourney("Api calls slack test", "ApiCallsSms");
    cy.wait(5000);
    cy.reload();
    cy.get(".justify-between > :nth-child(1) > .font-medium").then((el) => {
      expect(Number(el.text())).to.be.greaterThan(0);
    });
  });

  it("passes for firebase", () => {
    loginFunc(email, password);
    setFirebase();

    cy.contains("Messaging").click();
    cy.get('[data-disclosure-link="Template Builder"]').click();
    cy.url().should("include", "/templates");
    cy.get("#createTemplate").click();
    cy.get("#name").clear().type("ApiCallsFirebase");
    cy.get("#handleTemplateType").click();
    cy.get("#handleTemplateType").find('[data-option="firebase"]').click();
    cy.get("#submitTemplateCreation").click();
    cy.get(":nth-child(1) > .false:nth(0)").click();
    cy.get(".relative > #pushTitle").clear().type(apiCallTagToInsert, {
      parseSpecialCharSequences: false,
    });
    cy.get(":nth-child(2) > .false:nth(1)").click();
    cy.get(".relative > #pushText").clear().type(apiCallTagToInsert, {
      parseSpecialCharSequences: false,
    });
    cy.get("#saveDraftTemplate").click();

    runFirebaseJourney("Api calls firebase test", "ApiCallsFirebase");
  });
});
