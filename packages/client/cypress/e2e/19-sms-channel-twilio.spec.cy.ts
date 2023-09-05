import credentials from "../fixtures/credentials";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";

const { email, password, emailTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

const { TESTS_SMS_SID, TESTS_SMS_AUTH_TOKEN, TESTS_SMS_FROM } = Cypress.env();

describe("Add email sendgrid channel", () => {
  beforeEach(() => {
    cy.request("http://localhost:3001/tests/reset-tests");
    cy.wait(1000);
  });

  it("passes", () => {
    loginFunc(email, password);
    cy.get("#settings").click();
    cy.contains("Message channel").click();
    cy.get("#twilio-sms").click();

    cy.get("#twilio-account-sid-input").clear().type(TESTS_SMS_SID);
    cy.get("#twilio-auth-token-input").clear().type(TESTS_SMS_AUTH_TOKEN);
    cy.get("#twilio-sms-from-select").click();
  });
});
