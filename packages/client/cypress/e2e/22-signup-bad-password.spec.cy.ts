import credentials from "../fixtures/credentials.json";
import signup from "../test-helpers/signup";

const { email } = credentials;

describe("signup", () => {
  beforeEach(() => {
    cy.request("http://localhost:3001/tests/reset-tests");
    cy.wait(1000);
  });

  it("passes", () => {
    cy.visit("/");
    cy.clearCookies();
    cy.url().should("include", "/login");
    cy.get('[href="/signup"]').click();
    cy.url().should("include", "/signup");
    cy.get("#firstName").click().type("asfaf");
    cy.get("#lastName").type("knokno");
    cy.get("#email").type(email);
    cy.get("#password").type("1234567");
    cy.get("#confirmPassword").type("1234567");
    cy.get(":nth-child(5) > div > .flex").should("have.attr", "disabled");
    cy.url().should("not.include", "/home");
    cy.contains(
      "Password should be longer than 8 characters and passwords should be equal."
    ).should("exist");
  });
});
