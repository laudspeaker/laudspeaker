/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */

import credentials from "../fixtures/credentials";
import { createAutomaticComplexSegment } from "../test-helpers/createAutomaticComplexSegment";
import { loginFunc } from "../test-helpers/loginFunc";
import verifyAccount from "../test-helpers/verifyAccount";

const { email, password } = credentials.MessageHitUser;
const { automatic } = credentials.segments;

describe(
  "Create and use automatic segment in journey",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("TESTS_API_BASE_URL")}tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      verifyAccount();
      createAutomaticComplexSegment();

      cy.wait(3000);
      cy.get('[data-disclosure="Messaging"]').click();
      cy.get('[data-disclosure-link="Journey Builder"]').click();
      cy.wait(3000);
      cy.get("button").contains("Create Journey").click();
      cy.get("#name").should("exist").type("Any name");
      cy.get("#createJourneySubmit").click();
      cy.wait(3000);
      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").type("init");
      cy.get("#description").type("init description text");
      cy.contains("Finish later").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="true"]')
        .move({ deltaX: 100, deltaY: 100 });
      cy.wait(3000);
      cy.get("#email").drag('[data-isprimary="true"]', { force: true });
      cy.get("#activeJourney").click();
      cy.get("ul > li:nth(0)").click();
      cy.get("#exportSelectedTemplate").click();
      cy.contains("Next").click();
      cy.get("#event-conditions > .MuiFormControl-root").click();
      cy.get("#data-option-memberof > :nth-child(1) > div").click();
      cy.get("#event-conditions > :nth-child(2)").click();
      cy.contains(automatic.name).click();
      cy.get("#saveSegmentParams").click();
      cy.contains("Save").click();
      cy.contains("Start").click();

      cy.wait(5000);
      cy.reload();
      cy.get(".justify-between > :nth-child(1) > .font-medium").then((el) => {
        expect(Number(el.text())).greaterThan(0);
      });
    });
  }
);
