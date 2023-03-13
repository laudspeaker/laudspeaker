const { TESTS_DATABRICKS_HOST, TESTS_DATABRICKS_PATH, TESTS_DATABRICKS_TOKEN } =
  Cypress.env();

export default (
  dbName = "dbName1",
  dbDescription = "dbDescription1",
  host = TESTS_DATABRICKS_HOST,
  path = TESTS_DATABRICKS_PATH,
  token = TESTS_DATABRICKS_TOKEN,
  exists = true
) => {
  cy.contains("Settings").click();
  cy.contains("Data").click();
  cy.contains("Database import").click();
  cy.contains("Add new DB").click();

  cy.get("#name").clear().type(dbName);
  cy.get("#description").clear().type(dbDescription);
  cy.contains("Next").click();

  cy.contains("Next").click();

  cy.get("#host").clear().type(host);
  cy.get("#httpPath").clear().type(path);
  cy.get("#token").clear().type(token);
  cy.contains("Next").click();

  cy.get(".ace_content").click().type("SELECT * FROM default.mock_data_1;");
  cy.contains("Next").click();
  cy.wait(5000);

  if (exists) {
    cy.get("tr").should("have.length.above", 5);
    cy.contains("Save").click();

    cy.contains(dbName).should("exist");
  } else {
    cy.contains("There is something wrong").should("exist");
    cy.contains("NO DATA").should("exist");
  }
};
