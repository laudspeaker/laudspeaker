/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials.json";
import checkFailedEmailEventHit from "../test-helpers/checkFailedEmailEventHit";
import checkSuccessfulEmailEventHit from "../test-helpers/checkSuccessfulEmailEventHit";
import { loginFunc } from "../test-helpers/loginFunc";
import runTwoStepEmailJourney from "../test-helpers/runTwoStepEmailJourney";
import setFree3 from "../test-helpers/setFree3";
import setSendgrid from "../test-helpers/setSendgrid";
import { tamplatesFunc } from "../test-helpers/templatesFunc";

const { email, password, emailTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

describe(
  "Journey with email triggered and its deletion before event hit",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(10000);
    });

    it("passes for mailgun", () => {
      loginFunc(email, password);
      tamplatesFunc();
      runTwoStepEmailJourney(
        emailTemplate.name,
        emailTemplate.eventName,
        "someflow"
      );

      cy.contains("Journey Builder").click();
      cy.wait(10000);
      cy.contains("someflow")
        .parent("td")
        .parent("tr")
        .children("td:nth-child(3)")
        .children("div")
        .children("button")
        .click();
      cy.get("[data-delete-button]").click();
      cy.get('[label="Yes"]').click();
      cy.wait(10000);
      cy.contains("someflow").should("not.exist");

      checkFailedEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue
      );
    });

    it("passes for free3", () => {
      loginFunc(email, password);
      tamplatesFunc();
      setFree3();
      cy.contains("Messaging").click();
      runTwoStepEmailJourney(
        emailTemplate.name,
        emailTemplate.eventName,
        "someflow"
      );

      cy.contains("Journey Builder").click();
      cy.wait(10000);
      cy.contains("someflow")
        .parent("td")
        .parent("tr")
        .children("td:nth-child(3)")
        .children("div")
        .children("button")
        .click();
      cy.get("[data-delete-button]").click();
      cy.get('[label="Yes"]').click();
      cy.wait(10000);
      cy.contains("someflow").should("not.exist");

      checkFailedEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue
      );
    });

    it("passes for sengdrid", () => {
      loginFunc(email, password);
      tamplatesFunc();
      setSendgrid();
      cy.contains("Messaging").click();
      runTwoStepEmailJourney(
        emailTemplate.name,
        emailTemplate.eventName,
        "someflow"
      );

      cy.contains("Journey Builder").click();
      cy.wait(10000);
      cy.contains("someflow")
        .parent("td")
        .parent("tr")
        .children("td:nth-child(3)")
        .children("div")
        .children("button")
        .click();
      cy.get("[data-delete-button]").click();
      cy.get('[label="Yes"]').click();
      cy.wait(10000);
      cy.contains("someflow").should("not.exist");

      checkFailedEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue
      );
    });
  }
);
