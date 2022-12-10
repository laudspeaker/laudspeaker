/* eslint-disable jest/expect-expect */
import { loginFunc } from "../test-helpers/loginFunc";
import credentials from "../fixtures/credentials.json";

const { email, password } = credentials.MessageHitUser;

describe("Posthog sync", () => {
  beforeEach(() => {
    cy.request("http://localhost:3001/tests/reset-tests");
    cy.wait(1000);
  });

  it("passes", () => {
    loginFunc(email, password);
    cy.wait(2000);
    let accessToken = "";
    cy.window().then((win) => {
      accessToken = JSON.parse(win.localStorage.userData).access_token;

      cy.request({
        url: "http://localhost:3001/tests/posthogsynctest",
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      });
      cy.wait(2000);
      cy.visit("people");
      cy.get("td").should("have.length.above", 0);
    });
  });
});
