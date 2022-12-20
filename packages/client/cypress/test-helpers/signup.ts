import "@4tw/cypress-drag-drop";
export default (
  email: string,
  password: string,
  firstName = "John",
  lastName = "Smith"
) => {
  cy.visit("/");
  cy.clearCookies();
  cy.url().should("include", "/login");
  cy.get('[href="/signup"]').click();
  cy.url().should("include", "/signup");
  cy.get("#firstName").click().type(firstName);
  cy.get("#lastName").type(lastName);
  cy.get("#email").type(email);
  cy.get("#password").type(password);
  cy.get("#confirmPassword").type(password);
  cy.get(":nth-child(5) > div > .flex").click();
};
