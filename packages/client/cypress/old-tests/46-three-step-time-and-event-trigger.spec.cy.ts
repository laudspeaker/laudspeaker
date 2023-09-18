/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import createNewSegment from "../test-helpers/createNewSegment";
import { loginFunc } from "../test-helpers/loginFunc";
import setupDelayTrigger from "../test-helpers/setupDelayTrigger";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

const { email, password, slackTemplate, emailTemplate, userAPIkey } =
  credentials.MessageHitUser;

const audience1Name = "aud1";
const audience2Name = "j2j22";
const audience3Name = "uu2asfa";

describe(
  "Journey with three step email triggered for 2 users with time trigger and event trigger",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("AxiosURL")}tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      cy.contains("Audience").click();
      cy.contains("People").click();
      cy.contains("Create Person").click();
      cy.get("#name").type("NewUser");
      cy.get(".bg-white > .mt-6 button").click();
      cy.wait(5000);
      cy.contains("Edit").click();
      cy.contains("New attribute").click();
      cy.get(":nth-child(6) > :nth-child(1) > .relative > .mt-1").type("email");
      cy.get(":nth-child(2) > .relative > .mt-1").type("some-email@gmail.com");
      cy.contains("Add").click();
      cy.contains("Save").click();
      cy.contains("People").click();
      cy.get(":nth-child(1) > :nth-child(1) > .MuiTypography-root").then(
        (div) => {
          const customer1 = div.text();
          cy.get(":nth-child(2) > :nth-child(1) > .MuiTypography-root").then(
            (div) => {
              const customer2 = div.text();

              cy.wait(3000);

              templatesFunc(slackTemplate, emailTemplate);

              cy.get('[data-disclosure-link="Journey Builder"]').click();
              cy.wait(1000);
              cy.get("button").contains("Create Journey").click();
              cy.get("#name").should("exist").type("Multiple triggers flow");
              cy.get("#createJourneySubmit").click();
              cy.wait(3000);
              cy.get("#audience").click();
              cy.get("#name").type(audience1Name);
              cy.get("#description").type("init description text");
              cy.contains("Finish later").click();
              cy.wait(1000);
              cy.get(".react-flow__viewport")
                .get('[data-isprimary="true"]')
                .move({ deltaX: 100, deltaY: 100, force: true });

              cy.wait(3000);
              cy.get("#audience").click();
              cy.get("#name").type(audience2Name);
              cy.get("#description").type("slack description");
              cy.contains("Finish later").click();
              cy.wait(1000);
              cy.get(".react-flow__viewport")
                .get('[data-isprimary="false"]')
                .move({ deltaX: 50, deltaY: 300, force: true });
              cy.wait(1000);
              cy.get("#slack").drag('[data-isprimary="false"]');

              cy.get("#activeJourney").click();
              cy.contains(slackTemplate.name).click();
              cy.get("#exportSelectedTemplate").click();
              cy.wait(1000);
              setupDelayTrigger('[data-isprimary="true"]');
              cy.wait(1000);
              cy.get('[data-isprimary="true"]')
                .get("[data-handle-bottom]")
                .drag('[data-isprimary="false"] [data-handle-top]', {
                  force: true,
                });
              cy.wait(1000);
              cy.get('[data-isprimary="false"] [data-handle-top]').click({
                force: true,
              });
              cy.get("#saveNewSegment").click();

              cy.wait(3000);
              cy.get("#audience").click();
              cy.get("#name").type(audience3Name);
              cy.get("#description").type("email description");
              cy.contains("Finish later").click();
              cy.wait(3000);
              cy.contains(audience3Name).move({
                deltaX: 450,
                deltaY: 300,
                force: true,
              });
              cy.wait(3000);

              cy.get("#email").drag(".text-updater:last");
              cy.get("#activeJourney").click();
              cy.contains(emailTemplate.name).click();
              cy.get("#exportSelectedTemplate").click();

              setupEventTrigger(
                '[data-isprimary="true"]',
                emailTemplate.eventName,
                emailTemplate.eventName
              );

              cy.get("[data-handle-bottom]:last").drag(
                '[data-isprimary="false"] [data-handle-top]:last',
                { force: true }
              );
              cy.wait(1000);
              cy.get('[data-isprimary="false"] [data-handle-top]:last').click({
                force: true,
              });

              createNewSegment();

              cy.contains("Save").click();
              cy.wait(500);
              cy.contains("Start").click();
              cy.wait(3000);

              cy.wait(30000);

              cy.request(
                `${Cypress.env(
                  "AxiosURL"
                )}tests/audience-by-customer/${customer1}`
              ).then(({ body: { name } }) => {
                expect(name).to.equal(audience1Name);
              });
              cy.request(
                `${Cypress.env(
                  "AxiosURL"
                )}tests/audience-by-customer/${customer2}`
              ).then(({ body: { name } }) => {
                expect(name).to.equal(audience1Name);
              });

              cy.request({
                method: "POST",
                url: `${Cypress.env("AxiosURL")}events`,
                headers: {
                  Authorization: `Api-Key ${userAPIkey}`,
                },
                body: {
                  correlationKey: "email",
                  correlationValue: "some-email@gmail.com",
                  event: { [emailTemplate.eventName]: emailTemplate.eventName },
                },
              }).then(({ body }) => {
                cy.wait(2000);
                cy.request({
                  method: "POST",
                  headers: {
                    Authorization: `Api-Key ${userAPIkey}`,
                  },
                  url: `${Cypress.env("AxiosURL")}events/job-status/email`,
                  body: {
                    jobId: body[0]?.jobIds?.[0],
                  },
                }).then(({ body }) => {
                  expect(body).to.equal("completed");
                });
              });

              cy.wait(20000);

              cy.request(
                `${Cypress.env(
                  "AxiosURL"
                )}tests/audience-by-customer/${customer1}`
              ).then(({ body: { name } }) => {
                expect(name).to.equal(audience1Name);
              });
              cy.request(
                `${Cypress.env(
                  "AxiosURL"
                )}tests/audience-by-customer/${customer2}`
              ).then(({ body: { name } }) => {
                expect(name).to.equal(audience3Name);
              });

              cy.wait(20000);

              cy.request(
                `${Cypress.env(
                  "AxiosURL"
                )}tests/audience-by-customer/${customer1}`
              ).then(({ body: { name } }) => {
                expect(name).to.equal(audience2Name);
              });
              cy.request(
                `${Cypress.env(
                  "AxiosURL"
                )}tests/audience-by-customer/${customer2}`
              ).then(({ body: { name } }) => {
                expect(name).to.equal(audience3Name);
              });
            }
          );
        }
      );
    });
  }
);
