/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */
import credentials from "../fixtures/credentials.json";

const { userAPIkey } = credentials.MessageHitUser;

const mockPosthogEvent = {
  userId: "1",
  context: {
    a: "a",
  },
  channel: "s2s",
  type: "track",
  event: "clicked",
  phEmail: "test@gmail.com",
  originalTimestamp: "2022-12-23T07:10:53.781Z",
};

describe(
  "Journey with email triggered",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request("http://localhost:3001/tests/reset-tests");
      cy.wait(1000);
    });

    it("sends", () => {
      const randomId = String(-Math.round(Math.random() * 100000));

      mockPosthogEvent.userId = randomId;
      cy.request({
        method: "POST",
        url: "http://localhost:3001/events/posthog",
        headers: {
          Authorization: `Api-Key ${userAPIkey}`,
        },
        body: {
          batch: [mockPosthogEvent],
        },
      }).then(() => {
        cy.request(
          "http://localhost:3001/tests/test-posthog-customer/" + randomId
        ).then(({ body }) => {
          expect(body?.posthogId?.[0]).to.equal(randomId);
        });
      });
    });

    it("changes the customer", () => {
      const randomId = String(-Math.round(Math.random() * 100000));

      mockPosthogEvent.userId = randomId;
      cy.request({
        method: "POST",
        url: "http://localhost:3001/events/posthog",
        headers: {
          Authorization: `Api-Key ${userAPIkey}`,
        },
        body: {
          batch: [mockPosthogEvent],
        },
      }).then(() => {
        cy.request(
          "http://localhost:3001/tests/test-posthog-customer/" + randomId
        ).then(({ body }) => {
          expect(body?.posthogId?.[0]).to.equal(randomId);
          expect(body?.phEmail).to.equal("test@gmail.com");
          mockPosthogEvent.phEmail = "another-test@gmail.com";
          cy.request({
            method: "POST",
            url: "http://localhost:3001/events/posthog",
            headers: {
              Authorization: `Api-Key ${userAPIkey}`,
            },
            body: {
              batch: [mockPosthogEvent],
            },
          }).then(() => {
            cy.request(
              "http://localhost:3001/tests/test-posthog-customer/" + randomId
            ).then(({ body }) => {
              expect(body?.phEmail).to.equal("another-test@gmail.com");
            });
          });
        });
      });
    });
  }
);
