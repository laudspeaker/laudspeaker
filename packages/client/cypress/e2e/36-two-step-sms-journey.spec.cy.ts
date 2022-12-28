/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials.json";
import { loginFunc } from "../test-helpers/loginFunc";
import runTwoStepSMSJourney from "../test-helpers/runTwoStepSMSJourney";
import { tamplatesFunc } from "../test-helpers/templatesFunc";

const { email, password, smsTemplate, journeyName, userAPIkey } =
  credentials.MessageHitUser;

describe(
  "Journey with sms triggered",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      tamplatesFunc();
      runTwoStepSMSJourney(smsTemplate.name, smsTemplate.eventName);

      cy.request({
        method: "POST",
        url: `${Cypress.env("AxiosURL")}events`,
        headers: {
          Authorization: `Api-Key ${userAPIkey}`,
        },
        body: {
          correlationKey: "phone",
          correlationValue: smsTemplate.phone,
          event: { [smsTemplate.eventName]: smsTemplate.eventName },
        },
      }).then(({ body }) => {
        cy.wait(2000);
        cy.request({
          method: "POST",
          headers: {
            Authorization: `Api-Key ${userAPIkey}`,
          },
          url: `${Cypress.env("AxiosURL")}events/job-status/sms`,
          body: {
            jobId: body[0]?.jobIds?.[0],
          },
        }).then(({ body }) => {
          expect(body).to.equal("completed");
        });
      });
    });
  }
);
