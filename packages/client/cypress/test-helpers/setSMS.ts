// eslint-disable-next-line import/no-extraneous-dependencies
import "@4tw/cypress-drag-drop";

const { TESTS_SMS_SID, TESTS_SMS_AUTH_TOKEN, TESTS_SMS_FROM } = Cypress.env();

export default (
  sid: string = TESTS_SMS_SID,
  authToken: string = TESTS_SMS_AUTH_TOKEN,
  from: string = TESTS_SMS_FROM
) => {
  cy.get('[data-disclosure-link="Settings"] > .bg-cyan-700').click();
  cy.get(".-mb-px > :nth-child(3)").click();
  cy.wait(1000);
  cy.get(".-mb-px > :nth-child(4)").click();
  cy.get("#smsAccountSid").clear().type(sid);
  cy.get("#smsAuthToken").clear().type(authToken);
  cy.wait(7000);

  cy.get("#smsFrom").select(1);
  cy.get(".inline-flex").click();

  cy.wait(10000);
  cy.reload();
  cy.wait(3000);
};
