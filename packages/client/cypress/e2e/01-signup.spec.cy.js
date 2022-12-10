import credentials from "../fixtures/credentials.json";

const { email, password } = credentials;

describe("signup", () => {
  beforeEach(() => {
    cy.request("http://laudspeaker_backend_1:3001/tests/reset-tests");
    cy.wait(1000);
  });

  it("passes", () => {
    cy.visit("/");
    cy.clearCookies();
    cy.url().should("include", "/login");
    cy.get('[href="/signup"]').click();
    cy.url().should("include", "/signup");
    cy.get("#firstName").click().type("John");
    cy.get("#lastName").type("Smith");
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.get("#confirmPassword").type(password);
    cy.get(":nth-child(5) > div > .flex").click();
    cy.url().should("include", "/home");
  });
});
