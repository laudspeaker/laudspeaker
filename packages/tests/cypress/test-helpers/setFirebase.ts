import testFirebaseCredentials from "../fixtures/test-firebase-credentials.json";

const defaultFirebaseCredentials = JSON.stringify(
  testFirebaseCredentials,
  null,
  4
);

export default (fireBaseCredentials = defaultFirebaseCredentials) => {
  cy.get('[data-disclosure-link="Settings"] > .bg-cyan-700').click();
  cy.get(".-mb-px > :nth-child(5)").click();

  cy.get("#firebaseCredentials").clear().type(fireBaseCredentials);
  cy.contains("Save").click();
  cy.reload();
};
