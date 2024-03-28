import credentials from "../fixtures/credentials";
import createTestCustomer from "../test-helpers/createTestCustomer";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";
import setMailgun from "../test-helpers/setMailgun";
import { setupOrganization } from "../test-helpers/setupOrganization";
import signup from "../test-helpers/signup";
import uuid from "../test-helpers/uuid";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

describe("otherids and segment events", () => {
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
    const newUUID = uuid();

    setupOrganization(organizationName, timeZone);

    createTestCustomer(email);

    cy.wait(1000);
    cy.get("#personId")
      .invoke("text")
      .then((customerId) => {
        cy.get("#settings").click();
        cy.contains("API").click();
        cy.wait(1000);
        cy.get("#privateAPIKey")
          .invoke("val")
          .then((apiKey) => {
            cy.get("#users").click();
            cy.get(".id-cell:first").click();
            cy.request({
              url: `${Cypress.env("TESTS_API_BASE_URL")}/events/batch`,
              method: "POST",
              headers: { Authorization: `Api-Key ${apiKey}` },
              body: {
                batch: [
                  {
                    timestamp: "2024-03-15T02:31:05.295Z",
                    uuid: "F451DF0A-D713-4076-AE20-41AB1641BC98",
                    event: "$identify",
                    source: "mobile",
                    correlationKey: "_id",
                    payload: {
                      $anon_distinct_id: newUUID.toString(),
                      distinct_id: email,
                    },
                    correlationValue: newUUID.toString(),
                  },
                  {
                    timestamp: "2024-03-15T02:31:05.295Z",
                    event: "eventA",
                    source: "mobile",
                    correlationKey: "_id",
                    correlationValue: newUUID.toString(),
                  },
                ],
              },
            }).then(() => {
              cy.wait(1000);
              cy.reload();
              cy.contains(newUUID).should("exist");

              cy.contains("Journeys").click();
              cy.get("#event-tracker").click();
              cy.contains("$identify").should("exist");
              cy.contains("eventA").should("exist");

              cy.contains("Audience").click();
              cy.get("#segments").click();
              cy.contains("Create Segment").click();
              cy.get('[data-option="automatic"]').click();
              cy.get("#segmentName").type("1");

              cy.contains("Add condition").click();
              cy.contains("Attribute").click();
              cy.get('[data-option="Event"]').click();
              cy.get("input:nth(1)").type("eventA");
              cy.contains("Save").click();

              cy.wait(1000);
              cy.contains("Eligible users: 1 Users").should("exist");
            });
          });
      });
  });
});
