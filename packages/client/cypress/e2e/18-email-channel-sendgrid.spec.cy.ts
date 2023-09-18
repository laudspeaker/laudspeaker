import credentials from "../fixtures/credentials";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";

const { email, password, emailTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

const { TESTS_SENDGRID_API_KEY, TESTS_SENDGRID_FROM_EMAIL } = Cypress.env();

describe("Add email sendgrid channel", () => {
  beforeEach(() => {
    cy.request("http://localhost:3001/tests/reset-tests");
    cy.wait(1000);
  });

  it("passes", () => {
    loginFunc(email, password);
    cy.get("#settings").click();
    cy.contains("Message channel").click();
    cy.get("#email").click();

    cy.get("#sending-service-select").click();
    cy.get('[data-option="sendgrid"]').click();

    cy.get("#sendgrid-api-key-input").clear().type(TESTS_SENDGRID_API_KEY);
    cy.get("#sendgrid-email-input").clear().type(TESTS_SENDGRID_FROM_EMAIL);

    cy.get("#save-email-settings-button").click();
    cy.contains("Message channel").click();
    cy.get("#email").click();

    cy.get("#sendgrid-api-key-input").should(
      "contain.value",
      TESTS_SENDGRID_API_KEY
    );
    cy.get("#sendgrid-email-input").should(
      "contain.value",
      TESTS_SENDGRID_FROM_EMAIL
    );
  });
});
