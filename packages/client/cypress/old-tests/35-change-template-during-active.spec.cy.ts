/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import checkSuccessfulEmailEventHit from "../test-helpers/checkSuccessfulEmailEventHit";
import createNewSegment from "../test-helpers/createNewSegment";
import { loginFunc } from "../test-helpers/loginFunc";
import runTwoStepEmailJourney from "../test-helpers/runTwoStepEmailJourney";
import setupEventTrigger from "../test-helpers/setupEventTrigger";
import { templatesFunc } from "../test-helpers/templatesFunc";

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
      templatesFunc();
      cy.get('[data-disclosure-link="Journey Builder"]').click();
      cy.wait(1000);
      cy.get("button").contains("Create Journey").click();
      cy.get("#name").should("exist").type("Change template flow");
      cy.get("#createJourneySubmit").click();
      cy.wait(3000);
      cy.get("#audience").click();
      cy.get("#name").type("init");
      cy.get("#description").type("init description text");
      cy.contains("Finish later").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="true"]')
        .move({ deltaX: 100, deltaY: 100 });

      cy.wait(3000);
      cy.get("#audience").click();
      cy.get("#name").type("slack audience");
      cy.get("#description").type("slack description");
      cy.contains("Finish later").click();

      cy.get(".react-flow__viewport")
        .get('[data-isprimary="false"]')
        .move({ deltaX: 100, deltaY: 300 });

      cy.get("#email > .p-0 > .justify-between").drag(
        '[data-isprimary="false"]'
      );
      cy.get("#activeJourney").click();
      cy.contains(emailTemplate.name).click();
      cy.get("#exportSelectedTemplate").click();

      cy.get(".react-flow__viewport").get('[data-isprimary="true"]').click();
      setupEventTrigger('[data-isprimary="true"]', "A", "A");

      cy.get('[data-isprimary="true"]')
        .get("[data-handle-bottom]")
        .drag('[data-isprimary="false"] [data-handle-top]', {
          force: true,
        });

      cy.get('[data-isprimary="false"] [data-handle-top]').click();

      setupEventTrigger('[data-isprimary="false"]', "B", "B");

      cy.get('[data-isprimary="false"] [data-handle-bottom]').drag(
        '[data-isprimary="true"] [data-handle-top]',
        { force: true }
      );
      cy.get('[data-isprimary="true"] [data-handle-top]').click();

      createNewSegment();

      cy.contains("Save").click();
      cy.wait(1000);
      cy.contains("Start").click();
      cy.wait(1000);

      let template1: any, template2: any;
      cy.request({
        url: "http://localhost:3001/events",
        method: "POST",
        headers: {
          Authorization: `Api-Key ${userAPIkey}`,
        },
        body: {
          correlationKey: "email",
          correlationValue: email,
          event: {
            A: "A",
          },
        },
      }).then(({ body }) => {
        template1 = body?.[0]?.templates?.[0];
        cy.request({
          url: "http://localhost:3001/events",
          method: "POST",
          headers: {
            Authorization: `Api-Key ${userAPIkey}`,
          },
          body: {
            correlationKey: "email",
            correlationValue: email,
            event: {
              B: "B",
            },
          },
        }).then(() => {
          cy.wait(3000);
          cy.contains("Template Builder").click();
          cy.contains("TestTemplateForEmailSending").click();
          cy.get('[data-custominput-placeholder="Subject"]').click("left");
          cy.get("#title").clear().type("Another subject");
          cy.get("#saveDraftTemplate").click();
          cy.wait(3000);

          cy.request({
            url: "http://localhost:3001/events",
            method: "POST",
            headers: {
              Authorization: `Api-Key ${userAPIkey}`,
            },
            body: {
              correlationKey: "email",
              correlationValue: email,
              event: {
                A: "A",
              },
            },
          }).then(({ body }) => {
            template2 = body?.[0]?.templates?.[0];
            let isDifferent = false;

            for (const key of Object.keys(template1)) {
              if (template1[key] !== template2[key]) {
                isDifferent = true;
                break;
              }
            }

            expect(isDifferent).to.equal(true);
          });
        });
      });
    });
  }
);
