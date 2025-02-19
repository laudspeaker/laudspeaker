import credentials from "../fixtures/credentials";
import createTestCustomer from "../test-helpers/createTestCustomer";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";
import setMailgun from "../test-helpers/setMailgun";
import { setupOrganization } from "../test-helpers/setupOrganization";
import signup from "../test-helpers/signup";
import { uuid } from 'uuidv4';
import { createPrimaryKey } from "../test-helpers/createPrimaryKey";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

describe('Email settings', () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    signup(email, password, firstName, lastName);
    cy.wait(1000);
    setupOrganization(organizationName, timeZone);
    cy.contains("Settings").click();
    cy.contains("Message Channels").click();
  });

  describe('Mailgun settings', () => {

    it('should input data into Mailgun settings form', () => {
      cy.contains('Mailgun').click();
      cy.get('#mailgun-api-key-input')
        .type('test-api-key')
        .should('have.value', 'test-api-key');

      cy.get('#mailgun-domain-select').click();
      cy.get('.select-option')
        .first()
        .click();

      cy.contains('Add sending option').click();

      cy.get('#mailgun-sending-email')
        .eq(0)
        .type('example@mail.com')
        .should('have.value', 'example@mail.com');

      cy.get('#mailgun-sending-name')
        .eq(0)
        .type('Example Name')
        .should('have.value', 'Example Name');

    });
  });

  describe('Sendgrid settings', () => {

    it('should input data into Mailgun settings form', () => {
      cy.contains('Mailgun').click();
      cy.get('#mailgun-api-key-input')
        .type('test-api-key')
        .should('have.value', 'test-api-key');

      cy.get('#mailgun-domain-select').click();
      cy.get('.select-option')
        .first()
        .click();

      cy.contains('Add sending option').click();

      cy.get('#mailgun-sending-email')
        .eq(0)
        .type('example@mail.com')
        .should('have.value', 'example@mail.com');

      cy.get('#mailgun-sending-name')
        .eq(0)
        .type('Example Name')
        .should('have.value', 'Example Name');

    });
  });

  describe('Resend settings', () => {

    it('should input data into Mailgun settings form', () => {
      cy.contains('Mailgun').click();
      cy.get('#mailgun-api-key-input')
        .type('test-api-key')
        .should('have.value', 'test-api-key');

      cy.get('#mailgun-domain-select').click();
      cy.get('.select-option')
        .first()
        .click();

      cy.contains('Add sending option').click();

      cy.get('#mailgun-sending-email')
        .eq(0)
        .type('example@mail.com')
        .should('have.value', 'example@mail.com');

      cy.get('#mailgun-sending-name')
        .eq(0)
        .type('Example Name')
        .should('have.value', 'Example Name');

    });
  });
});
