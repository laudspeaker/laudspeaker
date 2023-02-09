/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable jest/valid-expect */
// eslint-disable-next-line import/no-extraneous-dependencies
import "@4tw/cypress-drag-drop";
import credentials from "../fixtures/credentials";
import createNewSegment from "./createNewSegment";
import setupEventTrigger from "./setupEventTrigger";

const {
  email,
  password,
  userAPIkey,
  emailTemplate,
  slackTemplate,
  smsTemplate,
} = credentials.MessageHitUser;

export enum PauseStopTestType {
  email = "email",
  slack = "slack",
  sms = "sms",
}

const templates = {
  [PauseStopTestType.email]: emailTemplate,
  [PauseStopTestType.slack]: slackTemplate,
  [PauseStopTestType.sms]: smsTemplate,
};

const correlationKeys = {
  [PauseStopTestType.email]: "email",
  [PauseStopTestType.slack]: "slackId",
  [PauseStopTestType.sms]: "phone",
};

const correlationValues = {
  [PauseStopTestType.email]: emailTemplate.correlationValue,
  [PauseStopTestType.slack]: slackTemplate.slackUid,
  [PauseStopTestType.sms]: smsTemplate.phone,
};

export default (type: PauseStopTestType = PauseStopTestType.email) => {
  cy.wait(1000);
  cy.get('[data-disclosure-link="Journey Builder"]').click();
  cy.wait(3000);
  cy.get("button").contains("Create Journey").click();
  cy.get("#name").should("exist").type("Pause and stop flow");
  cy.get("#createJourneySubmit").click();
  cy.wait(3000);
  cy.get("#audience").click();
  cy.get("#name").type("init");
  cy.get("#description").type("init description text");
  cy.get("#saveNewSegment").click();
  cy.contains("Finish later").click();

  cy.get(".react-flow__viewport")
    .get('[data-isprimary="true"]')
    .move({ deltaX: 100, deltaY: 100 });

  cy.wait(1000);
  cy.get("#audience").click();
  cy.get("#name").type("audience");
  cy.get("#description").type("description");
  cy.get("#saveNewSegment").click();
  cy.contains("Finish later").click();

  cy.get(".react-flow__viewport")
    .get('[data-isprimary="false"]')
    .move({ deltaX: 100, deltaY: 300 });

  cy.get('[data-isprimary="false"]').click();
  cy.get(`#${type} > .p-0 > .justify-between`).click();
  cy.get("#activeJourney").click();
  cy.contains(templates[type].name).click();
  cy.get("#exportSelectedTemplate").click();

  cy.get(".react-flow__viewport").get('[data-isprimary="true"]').click();
  setupEventTrigger("A", "A");

  cy.get('[data-isprimary="true"]')
    .get("[data-handle-bottom]")
    .drag('[data-isprimary="false"] [data-handle-top]', {
      force: true,
    });

  cy.get('[data-isprimary="false"] [data-handle-top]').click();
  cy.get('[data-isprimary="false"]').click();

  setupEventTrigger("B", "B");

  cy.get('[data-isprimary="false"] [data-handle-bottom]').drag(
    '[data-isprimary="true"] [data-handle-top]',
    { force: true }
  );
  cy.get('[data-isprimary="true"] [data-handle-top]').click();

  createNewSegment();

  cy.contains("Save").click();
  cy.wait(5000);
  cy.contains("Start").click();
  cy.wait(5000);
  cy.url().should("contain", "/view");
  cy.wait(5000);
  cy.contains("Pause").click();
  cy.wait(5000);

  cy.request({
    method: "POST",
    url: `${Cypress.env("AxiosURL")}events`,
    headers: {
      Authorization: `Api-Key ${userAPIkey}`,
    },
    body: {
      correlationKey: correlationKeys[type],
      correlationValue: correlationValues[type],
      event: { A: "A" },
    },
  }).then(({ body }) => {
    expect(body?.[0]?.jobIDs?.[0]).to.equal(undefined);
    cy.wait(5000);
    cy.contains("Resume").click();
    cy.wait(5000);
    cy.request({
      method: "POST",
      url: `${Cypress.env("AxiosURL")}events`,
      headers: {
        Authorization: `Api-Key ${userAPIkey}`,
      },
      body: {
        correlationKey: correlationKeys[type],
        correlationValue: correlationValues[type],
        event: { A: "A" },
      },
    }).then(({ body }) => {
      cy.wait(5000);
      cy.request({
        method: "POST",
        headers: {
          Authorization: `Api-Key ${userAPIkey}`,
        },
        url: `${Cypress.env("AxiosURL")}events/job-status/${type}`,
        body: {
          jobId: body[0]?.jobIds?.[0],
        },
      }).then(({ body }) => {
        expect(body).to.equal("completed");
        cy.request({
          method: "POST",
          url: `${Cypress.env("AxiosURL")}events`,
          headers: {
            Authorization: `Api-Key ${userAPIkey}`,
          },
          body: {
            correlationKey: correlationKeys[type],
            correlationValue: correlationValues[type],
            event: { B: "B" },
          },
        }).then(() => {
          cy.contains("Stop").click();
          cy.wait(5000);
          cy.contains("Yes").click();
          cy.wait(5000);
          cy.request({
            method: "POST",
            url: `${Cypress.env("AxiosURL")}events`,
            headers: {
              Authorization: `Api-Key ${userAPIkey}`,
            },
            body: {
              correlationKey: correlationKeys[type],
              correlationValue: correlationValues[type],
              event: { A: "A" },
            },
          }).then(({ body }) => {
            expect(body?.[0]?.jobIDs?.[0]).to.equal(undefined);
          });
        });
      });
    });
  });
};
