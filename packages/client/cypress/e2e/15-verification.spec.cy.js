/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";

const { email, password } = credentials.MessageHitUser;

describe(
  "Email verification",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("AxiosURL")}tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);

      cy.get('[data-disclosure-link="Settings"] > .bg-cyan-700').click();
      cy.contains("Waiting for verification: Resend").should("exist");
      cy.get(".text-black").click();
      cy.contains("We have sent you new email").should("exist");

      cy.request(`${Cypress.env("AxiosURL")}tests/test-verification`).then(
        ({ body }) => {
          expect(body.accountId).to.equal("-1000");
          expect(body.status).to.equal("sent");

          cy.request({
            url: `${Cypress.env("AxiosURL")}tests/verify-test-account/${
              body.id
            }`,
            method: "PATCH",
          }).then(() => {
            cy.reload();
            cy.contains("Your email is verified").should("exist");

            cy.get("#email").clear().type("another-email@gmail.com");
            cy.get(".border").click();
            cy.contains("Waiting for verification:").should("exist");
            cy.contains(
              "You need to verify your email. We've sent you a verification email"
            ).should("exist");
            cy.get("#email").should("have.attr", "disabled");
          });
        }
      );
    });
  }
);
