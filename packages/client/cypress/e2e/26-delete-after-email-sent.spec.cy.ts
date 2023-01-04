/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import checkSuccessfulEmailEventHit from "../test-helpers/checkSuccessfulEmailEventHit";
import { loginFunc } from "../test-helpers/loginFunc";
import runTwoStepEmailJourney from "../test-helpers/runTwoStepEmailJourney";
import setFree3 from "../test-helpers/setFree3";
import setSendgrid from "../test-helpers/setSendgrid";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, emailTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

describe(
  "Journey with email triggered and its deletion after event hit",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
    });

    it("passes for mailgun", () => {
      loginFunc(email, password);
      templatesFunc();
      runTwoStepEmailJourney(
        emailTemplate.name,
        emailTemplate.eventName,
        "someflow"
      );

      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue
      );
      cy.contains("Journey Builder").click();
      cy.wait(3000);
      cy.contains("someflow")
        .parent("td")
        .parent("tr")
        .children("td:nth-child(3)")
        .children("div")
        .children("button")
        .click();
      cy.get("[data-delete-button]").click();
      cy.get('[label="Yes"]').click();
      cy.wait(1000);
      cy.contains("someflow").should("not.exist");
    });

    it("passes for free3", () => {
      loginFunc(email, password);
      templatesFunc();
      setFree3();
      cy.contains("Messaging").click();
      runTwoStepEmailJourney(
        emailTemplate.name,
        emailTemplate.eventName,
        "someflow"
      );

      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue
      );
      cy.contains("Journey Builder").click();
      cy.wait(3000);
      cy.contains("someflow")
        .parent("td")
        .parent("tr")
        .children("td:nth-child(3)")
        .children("div")
        .children("button")
        .click();
      cy.get("[data-delete-button]").click();
      cy.get('[label="Yes"]').click();
      cy.wait(1000);
      cy.contains("someflow").should("not.exist");
    });

    it("passes for sengdrid", () => {
      loginFunc(email, password);
      templatesFunc();
      setSendgrid();
      cy.contains("Messaging").click();
      runTwoStepEmailJourney(
        emailTemplate.name,
        emailTemplate.eventName,
        "someflow"
      );

      checkSuccessfulEmailEventHit(
        userAPIkey,
        emailTemplate.eventName,
        "email",
        emailTemplate.correlationValue
      );
      cy.contains("Journey Builder").click();
      cy.wait(3000);
      cy.contains("someflow")
        .parent("td")
        .parent("tr")
        .children("td:nth-child(3)")
        .children("div")
        .children("button")
        .click();
      cy.get("[data-delete-button]").click();
      cy.get('[label="Yes"]').click();
      cy.wait(1000);
      cy.contains("someflow").should("not.exist");
    });
  }
);
