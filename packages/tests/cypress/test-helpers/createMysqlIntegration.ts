const { TESTS_MYSQL_URL, TESTS_MYSQL_QUERY } = Cypress.env();

export default (exists = true) => {
  cy.contains("Settings").click();
  cy.contains("Data").click();
  cy.contains("Database import").click();
  cy.contains("Add new DB").click();

  cy.get("#name").clear().type("MySql1");
  cy.get("#description").clear().type("MySql1Description");
  cy.contains("Next").click();

  cy.contains("Next").click();

  cy.contains("MySQL").click();

  cy.get("#connectionString")
    .clear()
    .type(exists ? TESTS_MYSQL_URL : "safasfasfas");

  cy.contains("Next").click();

  cy.get(".ace_content").click().type(TESTS_MYSQL_QUERY);
  cy.contains("Next").click();
  cy.wait(5000);

  if (exists) {
    cy.get("tr").should("have.length.above", 5);
    cy.contains("Save").click();

    cy.contains("MySql1").should("exist");
  } else {
    cy.contains("There is something wrong").should("exist");
    cy.contains("NO DATA").should("exist");
  }
};
