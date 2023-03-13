const {
  TESTS_POSTGRESQL_HOST,
  TESTS_POSTGRESQL_PORT,
  TESTS_POSTGRESQL_USERNAME,
  TESTS_POSTGRESQL_PASSWORD,
  TESTS_POSTGRESQL_DATABASE,
} = Cypress.env();

export default (
  dbName = "dbName2",
  dbDescription = "dbDescription2",
  host = TESTS_POSTGRESQL_HOST,
  port = TESTS_POSTGRESQL_PORT,
  username = TESTS_POSTGRESQL_USERNAME,
  password = TESTS_POSTGRESQL_PASSWORD,
  database = TESTS_POSTGRESQL_DATABASE,
  exists = true
) => {
  cy.contains("Settings").click();
  cy.get(".-mb-px > :nth-child(10)").click();
  cy.contains("Add new DB").click();

  cy.get("#name").clear().type(dbName);
  cy.get("#description").clear().type(dbDescription);
  cy.contains("Next").click();

  cy.contains("Next").click();

  cy.contains("PostgreSQL").click();

  cy.get("#host").clear().type(host);
  cy.get("#port").clear().type(port);
  cy.get("#username").clear().type(username);
  cy.get("#password").clear().type(password);
  cy.get("#database").clear().type(database);

  cy.contains("Next").click();

  cy.get(".ace_content").click().type("SELECT * FROM public.mockdata;");
  cy.contains("Next").click();
  cy.wait(5000);

  if (exists) {
    cy.contains("Sutherlan").should("exist");
    cy.contains("Kynder").should("exist");
    cy.contains("skynder0@bandcamp.com").should("exist");
    cy.contains("Save").click();

    cy.contains(dbName).should("exist");
  } else {
    cy.contains("There is something wrong").should("exist");
    cy.contains("NO DATA").should("exist");
  }
};
