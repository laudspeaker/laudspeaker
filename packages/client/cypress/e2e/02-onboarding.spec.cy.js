/* eslint-disable jest/expect-expect */
import credentials from "../fixtures/credentials";
import setMailgun from "../test-helpers/setMailgun";

const { email, password } = credentials;

describe("onboarding", () => {
  it("passes", () => {
    cy.viewport(1280, 1024);
    cy.visit("/");
    cy.clearCookies();
    cy.clearCookies();
    cy.url().should("include", "/login");
    cy.get("#email").clear().type(email);
    cy.get("#password").clear().type(password);
    cy.get("#loginIntoAccount").click();
    cy.contains("Active Journeys").should("exist");

    setMailgun();
  });
});
