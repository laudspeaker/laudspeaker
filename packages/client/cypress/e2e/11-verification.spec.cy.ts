/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";

const { email, password } = credentials;

describe(
  "Email verification",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    it("passes", () => {
      loginFunc(email, password);

      cy.contains("Verify your email").should("exist");

      cy.request(
        `${Cypress.env("AxiosURL")}tests/test-verification/${email}`
      ).then(({ body }) => {
        expect(body.status).to.equal("sent");

        cy.request({
          url: `${Cypress.env("AxiosURL")}auth/verify-email/${body.id}`,
          headers: {
            Authorization:
              "Bearer " +
              JSON.parse(localStorage.getItem("userData") || "")?.access_token,
          },
          method: "PATCH",
        }).then(() => {
          cy.reload();

          cy.contains("Hi, John").should("exist");
        });
      });

      // cy.get("#settings").click();
      // cy.contains("Your email is verified").should("exist");
      // cy.get("#email").clear().type("testmail1@gmail.com");
      // cy.get(".bg-cyan-600").click();
      // cy.contains("You need to verify your email").should("exist");

      // cy.request(
      //   `${Cypress.env("AxiosURL")}tests/test-verification/testmail1@gmail.com`
      // ).then(({ body }) => {
      //   expect(body.accountId).to.equal("00000000-0000-0000-0000-000000000000");
      //   expect(body.status).to.equal("sent");

      //   cy.request({
      //     url: `${Cypress.env("AxiosURL")}auth/verify-email/${body.id}`,
      //     headers: {
      //       Authorization:
      //         "Bearer " +
      //         JSON.parse(localStorage.getItem("userData") || "")?.access_token,
      //     },
      //     method: "PATCH",
      //   }).then(() => {
      //     cy.reload();
      //     cy.contains("Your email is verified").should("exist");

      //     cy.get("#email").clear().type("another-email@gmail.com");
      //     cy.get(".bg-cyan-600").click();
      //     cy.contains("Waiting for verification:").should("exist");
      //     cy.contains(
      //       "You need to verify your email. We've sent you a verification email"
      //     ).should("exist");
      //     cy.get("#email").should("have.attr", "disabled");
      //   });
      // });
    });
  }
);
