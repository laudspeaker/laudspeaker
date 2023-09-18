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

    cy.get("#currentPassword").type(password);
    cy.get("#newPassword").type("new-password");
    cy.contains("Passwords should match").should("exist");
    cy.get("#verifyNewPassword").type("new-password");
    cy.get(".bg-cyan-600").click();
    cy.contains("TFNameUser").click();
    cy.contains("Logout").click();
    loginFunc(email, password);
    cy.contains("Email or password is incorrect").should("exist");
    loginFunc(email, "new-password");
    cy.contains("Hi, TFNameUser").should("exist");
  });
});
