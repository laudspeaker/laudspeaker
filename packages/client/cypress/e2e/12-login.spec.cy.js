import { loginFunc } from "../test-helpers/loginFunc";

describe("signin", () => {
  it("passes", () => {
    loginFunc();
    cy.contains("Hi, John").should("exist");
  });
});
