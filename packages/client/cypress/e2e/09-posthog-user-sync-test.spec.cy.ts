/* eslint-disable jest/expect-expect */
import { loginFunc } from "../test-helpers/loginFunc";
import credentials from "../fixtures/credentials";

const { email, password } = credentials.MessageHitUser;

describe("Posthog sync", () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/api/tests/reset-tests`);
    cy.wait(1000);
  });

  it("passes", () => {
    loginFunc(email, password);
    cy.wait(2000);
    let accessToken = "";
    cy.window().then((win) => {
      accessToken = JSON.parse(win.localStorage.userData).access_token;

      cy.request({
        url: `${Cypress.env("TESTS_API_BASE_URL")}/api/tests/posthogsynctest`,
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      });
      cy.wait(20000);
      cy.visit("people");
      cy.get("td").should("have.length.above", 10);
    });
  });
});
