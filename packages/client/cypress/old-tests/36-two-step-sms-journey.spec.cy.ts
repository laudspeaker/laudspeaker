/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";
import runTwoStepSMSJourney from "../test-helpers/runTwoStepSMSJourney";
import { templatesFunc } from "../test-helpers/templatesFunc";

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
      templatesFunc();
      runTwoStepSMSJourney(smsTemplate.name, smsTemplate.eventName);

      cy.request({
        method: "POST",
        url: `${Cypress.env("AxiosURL")}events`,
        headers: {
          Authorization: `Api-Key ${userAPIkey}`,
        },
        body: {
          correlationKey: "phone",
          correlationValue: Cypress.env("TESTS_SMS_TO") || smsTemplate.phone,
          event: { [smsTemplate.eventName]: smsTemplate.eventName },
        },
      }).then(({ isOkStatusCode }) => {
        expect(isOkStatusCode).to.be.equal(true);
      });
    });
  }
);
