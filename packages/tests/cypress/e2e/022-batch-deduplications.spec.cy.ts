import credentials from "../fixtures/credentials";
import createTestCustomer from "../test-helpers/createTestCustomer";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";
import setMailgun from "../test-helpers/setMailgun";
import { setupOrganization } from "../test-helpers/setupOrganization";
import signup from "../test-helpers/signup";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

describe("Initial testing", () => {
  it("successfully loads index", () => {
    cy.visit("/");
  });
});

describe("batch and deduplication", () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    signup(email, password, firstName, lastName);
    cy.wait(1000);
  });

  it("passes", () => {
    cy.viewport(1920, 1080);
    setupOrganization(organizationName, timeZone);
    cy.get("#settings").click();
    cy.contains("API").click();
    cy.wait(1000);
    cy.get("#privateAPIKey")
      .invoke("val")
      .then((val) => {
        const apikey = val?.toString() || "no";
        createTestCustomer(email);
        cy.wait(1000);

        cy.request({
          method: "POST",
          url: `${Cypress.env("TESTS_API_BASE_URL")}/events/batch`,
          headers: { Authorization: `Api-Key ${apikey}` },
          body: {
            batch: [
              {
                timestamp: "2024-03-15T02:31:05.295Z",
                uuid: "F451DF0A-D713-4076-AE20-41AB1641BC98",
                event: "$identify",
                source: "mobile",
                correlationKey: "_id",
                payload: {
                  $anon_distinct_id: "FBBBCB26-B75E-4342-B40B-568BF879F7C5",
                  distinct_id: email,
                },
                correlationValue: "FBBBCB26-B75E-4342-B40B-568BF879F7C5",
              },
              {
                timestamp: "2024-03-15T02:31:05.313Z",
                uuid: "A97E8A44-AAB0-45C6-B68D-3CAD9A0ED0DD",
                correlationKey: "_id",
                correlationValue: "FBBBCB26-B75E-4342-B40B-568BF879F7C5",
                source: "mobile",
                event: "$set",
                payload: {
                  mkt_agree: true,
                },
              },
              {
                correlationKey: "_id",
                source: "mobile",
                uuid: "24291D14-944D-4C7B-B0E4-EC98B8A9DF46",
                correlationValue: "FBBBCB26-B75E-4342-B40B-568BF879F7C5",
                event: "MY_home_view",
                payload: {
                  service: "MY",
                  user: "KCB미연결",
                  tap: "open",
                },
                timestamp: "2024-03-15T02:31:05.333Z",
              },
              {
                source: "mobile",
                correlationValue: "FBBBCB26-B75E-4342-B40B-568BF879F7C5",
                event: "MY_home_view",
                correlationKey: "_id",
                uuid: "46300C36-EB75-483D-9955-555233CE648C",
                payload: {
                  service: "MY",
                  user: "KCB미연결",
                  tap: "main",
                },
                timestamp: "2024-03-15T02:31:05.353Z",
              },
              {
                source: "mobile",
                correlationKey: "_id",
                correlationValue: "FBBBCB26-B75E-4342-B40B-568BF879F7C5",
                payload: {
                  id: 2,
                  service: "MY",
                },
                timestamp: "2024-03-15T02:31:05.443Z",
                uuid: "C3EE7322-CBA2-49C4-B118-87DD86AAA5D0",
                event: "MY_banner_list_view",
              },
            ],
          },
        }).then(() => {
          cy.wait(1000);

          cy.request({
            method: "POST",
            url: `${Cypress.env("TESTS_API_BASE_URL")}/events/batch`,
            headers: { Authorization: `Api-Key ${apikey}` },
            body: {
              batch: [
                {
                  correlationKey: "_id",
                  source: "mobile",
                  uuid: "24291D14-944D-4C7B-B0E4-EC98B8A9DF46",
                  correlationValue: "00000B26-B75E-4342-B40B-568BF879F7C5",
                  event: "MY_home_view",
                  payload: {
                    service: "MY",
                    user: "KCB미연결",
                    tap: "open",
                  },
                  timestamp: "2024-03-15T02:31:05.333Z",
                },
                {
                  timestamp: "2024-03-15T02:31:05.295Z",
                  uuid: "F451DF0A-D713-4076-AE20-41AB1641BC98",
                  event: "$identify",
                  source: "mobile",
                  correlationKey: "_id",
                  payload: {
                    $anon_distinct_id: "00000B26-B75E-4342-B40B-568BF879F7C5",
                    distinct_id: email,
                  },
                  correlationValue: "00000B26-B75E-4342-B40B-568BF879F7C5",
                },
              ],
            },
          }).then(() => {
            cy.wait(1000);
            cy.get("#users").click();
            cy.get(".id-cell:first").click();
            cy.contains("FBBBCB26-B75E-4342-B40B-568BF879F7C5").should("exist");
            cy.contains("00000B26-B75E-4342-B40B-568BF879F7C5").should("exist");
            cy.contains("mkt_agree").should("exist");
            cy.contains("true").should("exist");
          });
        });
      });
  });
});
