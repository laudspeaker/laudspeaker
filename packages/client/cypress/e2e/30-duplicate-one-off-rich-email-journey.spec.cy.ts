/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials.json";
import { loginFunc } from "../test-helpers/loginFunc";
import runEmailJourney from "../test-helpers/runEmailJourney";
import { tamplatesFunc } from "../test-helpers/templatesFunc";

const { email, password, slackTemplate, emailTemplate } =
  credentials.MessageHitUser;

describe(
  "Journey with single step email triggered and duplicating it",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("AxiosURL")}tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      tamplatesFunc(slackTemplate, emailTemplate);
      runEmailJourney("Journey with rich email", "example-template-bill");

      cy.contains("Journey Builder").click();
      cy.wait(3000);
      cy.contains("Journey with rich email")
        .parent("td")
        .parent("tr")
        .children("td:nth-child(3)")
        .children("div")
        .children("button")
        .click();
      cy.get("[data-duplicate-button]").click();
      cy.wait(1000);
      cy.contains("Journey with rich email-copy-1").click();
      cy.contains("Start").click();
    });
  }
);
