import credentials from "../fixtures/credentials";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";

const { email, password, emailTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

describe("Delete account", () => {
  beforeEach(() => {
    cy.request("http://localhost:3001/tests/reset-tests");
    cy.wait(1000);
  });

  it("passes", () => {
    loginFunc(email, password);
    cy.get("#settings").click();

    cy.get("#delete-account-button").click();
    cy.get("#delete-account-modal-password-input").type(password);
    cy.get("#delete-account-modal-button").click();

    loginFunc(email, password);
    cy.contains("Email or password is incorrect").should("exist");
  });
});
