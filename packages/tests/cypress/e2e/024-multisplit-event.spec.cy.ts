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

/*
describe("multisplit event", () => {
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
    cy.get("#privateAPIKey")
      .invoke("val")
      .then((val) => {
        const apikey = val?.toString() || "no";
        createTestCustomer(email);
        cy.wait(1000);
        cy.visit("/home");
        cy.url().should("include", "/home");
        cy.contains("Journeys").click();
        cy.contains("Journey Builder").click();
        cy.get("#create-journey").click();
        cy.get("#journey-name-input").clear().type("test00000-3");
        cy.get("#create-journey-modal-button").click();
        drag("#waitUntil", ".empty-node");
        cy.get(".text-muted").click();
        cy.get('[data-option="event"]').click();
        cy.get("input").clear().type("eventA");
        cy.contains("Save").click();
        cy.get("#save-node-data").click();
        drag("#multisplit", ".empty-node");
        cy.contains("Add branch").click();
        cy.contains("Add condition").click();
        cy.contains("Attribute").click();
        cy.get('[data-option="Event"]').click();
        cy.get("input:first").clear().type("eventB");
        cy.get(':contains("Add"):last').click();
        cy.get("#save-node-data").click();
        drag("#email", ".empty-node:first");
        cy.get("#template-select").select(1);
        cy.get("#save-node-data").click();
        drag("#email", ".empty-node:last");
        cy.get("#template-select").select(2);
        cy.get("#save-node-data").click();
        cy.get(".react-flow__node-waitUntil").click();
        // cy.get(".react-flow__node-waitUntil").trigger("mouseenter");
        // cy.get(".react-flow__node-waitUntil").trigger("mouseover");
        // cy.get(".react-flow__node-waitUntil").trigger("mousemove");
        // cy.get(".react-flow__node-waitUntil").trigger("mousedown");
        cy.get(".react-flow__node-waitUntil").trigger("click");
        // drag("#jumpTo", ".empty-node:first");
        // cy.wait(1000);
        // cy.get(".wait-until-node").click();
        cy.get("#next-button").click();
        cy.get("#next-button").click();
        cy.get("#next-button").click();
        cy.get("#start-journey-button").click();
        cy.get("#journey-start-verify-button").click();
        cy.contains("Journey has been started").should("exist");
        cy.get(".sent:first").contains("0");
        cy.get(".sent:first").contains("0");
        cy.request({
          method: "POST",
          url: `${Cypress.env("TESTS_API_BASE_URL")}/events`,
          headers: { Authorization: `Api-Key ${apikey}` },
          body: {
            event: "eventA",
            source: "custom",
            correlationKey: "email",
            correlationValue: email,
          },
        }).then(() => {
          cy.reload();
          cy.get(".sent:first").contains("0");
          cy.get(".sent:first").contains("0");
          cy.request({
            method: "POST",
            url: `${Cypress.env("TESTS_API_BASE_URL")}/events`,
            headers: { Authorization: `Api-Key ${apikey}` },
            body: {
              event: "eventB",
              source: "custom",
              correlationKey: "email",
              correlationValue: email,
            },
          }).then(() => {
            cy.reload();
            cy.get(".sent:first").contains("0");
            cy.get(".sent:first").contains("0");
          });
        });
      });
  });
});
*/
