/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials.json";
import { loginFunc } from "../test-helpers/loginFunc";
import { tamplatesFunc } from "../test-helpers/templatesFunc";

const { email, password, emailTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

describe(
  "Journey with email triggered",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      tamplatesFunc();
      cy.get('[data-disclosure-link="Journey Builder"]').click();
      cy.get(".mt-6 > .inline-flex").click();
      cy.get("#name").type("Email flow");
      cy.get("#createJourneySubmit").click();
      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").type("Initial");
      cy.get("#saveNewSegment").click();
      cy.get(".text-updater").move({ deltaX: 100, deltaY: 100 });
      cy.get("#audience > .p-0 > .justify-between").click();
      cy.get("#name").type("Second");
      cy.get("#saveNewSegment").click();
      cy.get('[data-isprimary]:not([data-isprimary="true"])').move({
        deltaX: 100,
        deltaY: 300,
      });
      cy.get('[data-isprimary]:not([data-isprimary="true"])').click();
      cy.get("#email > .p-0 > .justify-between").click();
      cy.get("#activeJourney").click();
      cy.contains(emailTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();
      cy.get('[data-isprimary="true"]').click();
      cy.get("#eventBased > .p-0 > .justify-between").click();
      cy.contains("Add Condition Or Group").click();
      cy.contains("Events").click();
      cy.get("#events").type(emailTemplate.eventName);
      cy.get('[data-savetriggerreator="true"] > .inline-flex').click();
      cy.get(
        '[style="display: flex; height: 15px; position: absolute; left: 0px; bottom: 0px; align-items: center; width: 100%; justify-content: space-around;"] > .react-flow__handle'
      ).drag('[data-isprimary]:not([data-isprimary="true"])');
      cy.get('[data-isprimary]:not([data-isprimary="true"])').click();
      cy.contains("Save").click();
      cy.contains("Start").click();
      cy.request({
        method: "POST",
        url: `${Cypress.env("AxiosURL")}events`,
        headers: {
          Authorization: `Api-Key ${userAPIkey}`,
        },
        body: {
          correlationKey: "email",
          correlationValue: emailTemplate.correlationValue,
          event: emailTemplate.eventName,
        },
      }).then(({ body }) => {
        cy.wait(1000);
        cy.request({
          method: "POST",
          headers: {
            Authorization: `Api-Key ${userAPIkey}`,
          },
          url: `${Cypress.env("AxiosURL")}events/job-status/email`,
          body: {
            jobId: body[0],
          },
        }).then(({ body }) => {
          expect(body).to.equal("completed");
        });
      });
    });
  }
);
