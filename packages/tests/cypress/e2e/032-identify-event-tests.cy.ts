import credentials from "../fixtures/credentials";
import createTestCustomer from "../test-helpers/createTestCustomer";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";
import setMailgun from "../test-helpers/setMailgun";
import { setupOrganization } from "../test-helpers/setupOrganization";
import signup from "../test-helpers/signup";
import uuid from "../test-helpers/uuid";
import { uuid } from 'uuidv4';
import { createPrimaryKey } from "../test-helpers/createPrimaryKey";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

describe("Identify test", () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    signup(email, password, firstName, lastName);
    cy.wait(1000);
  });

  it("test distinct_id", () => {
    const newUUID = uuid();
    const someUUID = uuid();

    // minimal event
    // public LaudspeakerEvent(String event, String id, Map<String, Object> payload) {
    //     this.event = event;
    //     this.correlationValue = id;
    //     this.payload = payload;
    //     this.timestamp = new Date();
    //     this.uuid = UUID.randomUUID();
    // }
    cy.viewport(1920, 1080);
    setupOrganization(organizationName, timeZone);
    cy.get("#settings").click();
    cy.contains("API").click();
    cy.wait(1000);
    cy.get("#privateAPIKey")
      .invoke("val")
      .then((val) => {
        const apikey = val?.toString() || "no";
        cy.wait(1000);
        createPrimaryKey("email");
        cy.request({
          method: "POST",
          url: `${Cypress.env("TESTS_API_BASE_URL")}/events/batch`,
          headers: { Authorization: `Api-Key ${apikey}` },
          body: {
            batch: [
              {
                event: "$identify",
                correlationValue: newUUID,
                payload: {
                  distinct_id: email,
                },
                timestamp: new Date().toString,
                uuid: someUUID,
              },
            ]
          },
        }).then(() => {
          cy.wait(1000);

          cy.visit("/people");

          cy.get('.id-cell').should('have.length', 1);

          cy.get(".id-cell:first").click();
          cy.contains(`Id: ${newUUID}`).should("exist");
          cy.contains("email").should("exist");
          cy.contains(email).should("exist");
        });
      });
  });

  it("test $anon_distinct_id", () => {
    const newUUID = uuid();
    const someUUID = uuid();

    cy.viewport(1920, 1080);
    setupOrganization(organizationName, timeZone);
    cy.get("#settings").click();
    cy.contains("API").click();
    cy.wait(1000);
    cy.get("#privateAPIKey")
      .invoke("val")
      .then((val) => {
        const apikey = val?.toString() || "no";
        cy.wait(1000);
        createPrimaryKey("email");
        cy.request({
          method: "POST",
          url: `${Cypress.env("TESTS_API_BASE_URL")}/events/batch`,
          headers: { Authorization: `Api-Key ${apikey}` },
          body: {
            batch: [
              {
                event: "$identify",
                correlationValue: newUUID,
                payload: {
                  $anon_distinct_id: newUUID.toString(),
                  distinct_id: email,
                },
                timestamp: new Date().toString,
                uuid: someUUID,
              },
            ]
          },
        }).then(() => {
          cy.wait(1000);

          cy.visit("/people");

          cy.get('.id-cell').should('have.length', 1);

          cy.get(".id-cell:first").click();
          cy.contains(`Id: ${newUUID}`).should("exist");
          cy.contains("email").should("exist");
          cy.contains(email).should("exist");
        });
      });
  });
});


