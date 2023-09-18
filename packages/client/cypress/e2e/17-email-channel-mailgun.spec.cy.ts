import credentials from "../fixtures/credentials";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";

const { TESTS_MAILGUN_API_KEY } = Cypress.env();

const { email, password, emailTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

describe("Add email mailgun channel", () => {
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
    cy.get('[data-option="mailgun"]').click();

    cy.get("#mailgun-api-key-input").clear().type(TESTS_MAILGUN_API_KEY);
    cy.get("#mailgun-domain-select").click();
    cy.get('[data-option="hello.laudspeaker.com"]').click();
    cy.get("#mailgun-sending-name-input").clear().type("sname1");
    cy.get("#mailgun-sending-email-input").clear().type("semail1");
    cy.get("#save-email-settings-button").click();

    cy.contains("Message channel").click();
    cy.get("#email").click();
    cy.get("#sending-service-select").should("contain", "Mailgun");
    cy.get("#mailgun-api-key-input").should(
      "contain.value",
      TESTS_MAILGUN_API_KEY
    );
    cy.get("#mailgun-domain-select").should("contain", "hello.laudspeaker.com");
    cy.get("#mailgun-sending-name-input").should("contain.value", "sname1");
    cy.get("#mailgun-sending-email-input").should("contain.value", "semail1");

  });
});
