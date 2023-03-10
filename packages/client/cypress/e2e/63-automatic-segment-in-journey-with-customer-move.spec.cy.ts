/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */

import credentials from "../fixtures/credentials";
import { createAutomaticComplexSegment } from "../test-helpers/createAutomaticComplexSegment";
import { createManualSegment } from "../test-helpers/createManualSegment";
import { loginFunc } from "../test-helpers/loginFunc";

import verifyAccount from "../test-helpers/verifyAccount";

const { email, password } = credentials.MessageHitUser;
const { automatic } = credentials.segments;

describe(
  "Create and use automatic segment, enroll and unenroll customers by changing segment and customer",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("AxiosURL")}tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      let workflowId = "",
        customersInSegment = 0;

      loginFunc(email, password);
      verifyAccount();
      createManualSegment();
      cy.get('[data-disclosure="Audience"]').click();
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
      cy.location("pathname").then((data) => {
        workflowId = data.split("/")[data.split("/").length - 1];
      });
      cy.contains("Save").click();
      cy.contains("Start").click();

      cy.wait(5000);
      cy.reload();
      cy.get(".justify-between > :nth-child(1) > .font-medium").then((el) => {
        expect(Number(el.text())).greaterThan(0);
      });

      cy.get('[data-disclosure="Audience"]').click();
      cy.get('[data-disclosure-link="Segments"]').click();
      cy.contains(automatic.name).click();

      cy.wait(1200).then(() => {
        cy.request(
          `${Cypress.env(
            "AxiosURL"
          )}tests/get-workflow-customer-amount/${workflowId}`
        ).then(({ body }) => {
          customersInSegment = Number(body);
        });
      });

      cy.get(".overflow-visible img:nth(1)").click().wait(800);
      cy.get(".overflow-visible img:nth(1)").click().wait(800);
      cy.get(".overflow-visible img:nth(1)").click().wait(800);

      cy.get("#saveSegmentParams")
        .click()
        .wait(5000)
        .then(() => {
          cy.request(
            `${Cypress.env(
              "AxiosURL"
            )}tests/get-workflow-customer-amount/${workflowId}`
          ).then(({ body }) => {
            expect(Number(body)).greaterThan(customersInSegment);
            customersInSegment = Number(body);
          });
        });

      // slack admin true
      cy.contains("select").click();
      cy.get("#data-option-attributes > :nth-child(1) > div").click().wait(500);
      cy.get("#event-conditions > :nth-child(2)").last().click().wait(500);
      cy.get("#data-option-slackAdmin > :nth-child(1) > div").click().wait(500);
      cy.get("#event-conditions > :nth-child(3)").last().click().wait(500);
      cy.get("#data-option-isBoolEqual > :nth-child(1) > div")
        .click()
        .wait(500);
      cy.get("#event-conditions > :nth-child(4)").last().click().wait(500);
      cy.get("#data-option-true > :nth-child(1) > div").click();
      cy.wait(1000);

      // phone exist
      cy.contains("select").click().wait(500);
      cy.get("#data-option-attributes > :nth-child(1) > div").click().wait(500);
      cy.get("#event-conditions > :nth-child(2)").last().click().wait(500);
      cy.get("#data-option-phone > :nth-child(1) > div").click().wait(500);
      cy.get("#event-conditions > :nth-child(3)").last().click().wait(500);
      cy.get("#data-option-exists > :nth-child(1) > div").click();
      cy.wait(1000);

      // slackId not equal to U00000
      cy.contains("select").click();
      cy.get("#data-option-attributes > :nth-child(1) > div").click().wait(500);
      cy.get("#event-conditions > :nth-child(2)").last().click().wait(500);
      cy.get("#data-option-slackId > :nth-child(1) > div").click().wait(500);
      cy.get("#event-conditions > :nth-child(3)").last().click().wait(500);
      cy.get("#data-option-isNotEqual > :nth-child(1) > div").click().wait(500);
      cy.get("#isNotEqual").type("U00000");

      cy.get("#saveSegmentParams")
        .click()
        .wait(5000)
        .then(() => {
          cy.request(
            `${Cypress.env(
              "AxiosURL"
            )}tests/get-workflow-customer-amount/${workflowId}`
          ).then(({ body }) => {
            expect(Number(body)).lessThan(customersInSegment);
            customersInSegment = Number(body);
          });
        });

      cy.get(".overflow-visible img:nth(1)").click().wait(800);
      cy.get(".overflow-visible img:nth(1)").click().wait(800);
      cy.get(".overflow-visible img:nth(1)").click().wait(800);
      cy.get("#contains").clear().type("@nongmail.com234");

      cy.get("#saveSegmentParams")
        .click()
        .wait(5000)
        .then(() => {
          cy.request(
            `${Cypress.env(
              "AxiosURL"
            )}tests/get-workflow-customer-amount/${workflowId}`
          ).then(({ body }) => {
            expect(Number(body)).lessThan(customersInSegment);
            customersInSegment = Number(body);
          });
        });

      cy.get('[data-disclosure-link="People"]').click();
      cy.get(".divide-y > :nth-child(3) > :nth-child(1)").click();

      cy.contains("Edit").click();
      cy.get("#email").clear().type("newMail@nongmail.com234");
      cy.contains("Save").click();

      cy.wait(5000).then(() => {
        cy.request(
          `${Cypress.env(
            "AxiosURL"
          )}tests/get-workflow-customer-amount/${workflowId}`
        ).then(({ body }) => {
          expect(Number(body)).greaterThan(customersInSegment);
          customersInSegment = Number(body);
        });
      });

      cy.contains("Edit").click();
      cy.get("#email").clear().type("newMail@nongmail.34");
      cy.contains("Save").click();

      cy.wait(5000).then(() => {
        cy.request(
          `${Cypress.env(
            "AxiosURL"
          )}tests/get-workflow-customer-amount/${workflowId}`
        ).then(({ body }) => {
          expect(Number(body)).lessThan(customersInSegment);
          customersInSegment = Number(body);
        });
      });
    });
  }
);
