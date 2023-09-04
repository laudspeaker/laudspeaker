import credentials from "../fixtures/credentials";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";

const { email, password, emailTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

describe("Change First and Last Name in Settings", () => {
  beforeEach(() => {
    cy.request("http://localhost:3001/tests/reset-tests");
    cy.wait(1000);
  });

  it("passes", () => {
    loginFunc(email, password);
    cy.get("#settings").click();
    cy.get("#firstName").clear().type("ChangedFirstName");
    cy.get("#lastName").clear().type("ChangedLastName");
    cy.get(".bg-cyan-600").click();
    cy.contains("Data saved").should("exist");
    cy.reload();
    cy.get("#firstName").should("have.value", "ChangedFirstName");
    cy.get("#lastName").should("have.value", "ChangedLastName");
  });
});
