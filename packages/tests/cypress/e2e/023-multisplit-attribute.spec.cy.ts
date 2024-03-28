import credentials from "../fixtures/credentials";
import createTestCustomer from "../test-helpers/createTestCustomer";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";
import setMailgun from "../test-helpers/setMailgun";
import { setupOrganization } from "../test-helpers/setupOrganization";
import signup from "../test-helpers/signup";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

describe("multisplit attribute", () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    signup(email, password, firstName, lastName);
    cy.wait(1000);
  });

  it("passes if multisplit first branch", () => {
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
        cy.reload();
        cy.contains("Edit").click();
        cy.contains("Add attribute").click();
        cy.contains("mkt_agree").click();
        cy.contains("value").click();
        cy.get('[data-option="true"]').click();
        cy.contains("Save").click();

        cy.wait(1000);
        cy.visit("/home");
        cy.url().should("include", "/home");

        cy.contains("Journeys").click();
        cy.get("#campaigns").click();
        cy.get("#create-template-button").click();
        cy.get("#name").type("Webhook1");
        cy.get("#handleTemplateType").click();
        cy.get('[data-option="webhook"]').click();
        cy.get("#submitTemplateCreation").click();
        cy.get("#webhookURL").type(
          `${Cypress.env("TESTS_API_BASE_URL")}/events`
        );
        cy.get("#custom-header").type(`Api-Key ${apikey}`);
        cy.contains("Content").click();

        cy.get("#webhook-body").type(
          JSON.stringify(
            {
              event: "webhook1",
              source: "custom",
              correlationKey: "email",
              correlationValue: email,
            },
            null,
            2
          )
        );
        cy.get("#saveDraftTemplate").click();
        cy.get(".invert").click();

        cy.get("#create-template-button").click();
        cy.get("#name").type("Webhook2");
        cy.get("#handleTemplateType").click();
        cy.get('[data-option="webhook"]').click();
        cy.get("#submitTemplateCreation").click();
        cy.get("#webhookURL").type(
          `${Cypress.env("TESTS_API_BASE_URL")}/events`
        );
        cy.get("#custom-header").type(`Api-Key ${apikey}`);
        cy.contains("Content").click();

        cy.get("#webhook-body").type(
          JSON.stringify(
            {
              event: "webhook2",
              source: "custom",
              correlationKey: "email",
              correlationValue: email,
            },
            null,
            2
          )
        );
        cy.get("#saveDraftTemplate").click();
        cy.get(".invert").click();

        cy.get("#journeys").click();
        cy.get("#create-journey").click();

        cy.get("#journey-name-input").clear().type("test00000");
        cy.get("#create-journey-modal-button").click();

        drag("#waitUntil", ".empty-node");
        cy.wait(500);
        cy.get(".text-muted").click();
        cy.get('[data-option="event"]').click();
        cy.get("input").clear().type("eventA");
        cy.contains("Save").click();
        cy.get("#save-node-data").click();

        drag("#multisplit", ".empty-node");
        cy.wait(500);
        cy.contains("Add branch").click();
        cy.contains("Add condition").click();
        cy.get("input:first").clear().type("mkt_agree");
        cy.contains("value").click();
        cy.get('[data-option="true"]').click();
        cy.get(':contains("Add"):last').click();
        cy.get("#save-node-data").click();

        drag("#webhook", ".empty-node:first");
        cy.wait(500);
        cy.get("#template-select").select(1);
        cy.get("#save-node-data").click();

        drag("#webhook", ".empty-node:last");
        cy.wait(500);
        cy.get("#template-select").select(2);
        cy.get("#save-node-data").click();

        cy.get("#next-button").click();
        cy.get("#next-button").click();
        cy.get("#next-button").click();
        cy.get("#start-journey-button").click();
        cy.get("#journey-start-verify-button").click();

        cy.contains("Journey has been started").should("exist");

        cy.wait(1000);

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
          cy.wait(1000);
          cy.reload();
          cy.get("#event-tracker").click();
          cy.contains("webhook1").should("exist");
        });
      });
  });

  it("passes if multisplit other branch", () => {
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
        cy.reload();
        cy.contains("Edit").click();
        cy.contains("Add attribute").click();
        cy.contains("mkt_agree").click();
        cy.contains("value").click();
        cy.get('[data-option="false"]').click();
        cy.contains("Save").click();

        cy.wait(1000);
        cy.visit("/home");
        cy.url().should("include", "/home");

        cy.contains("Journeys").click();
        cy.get("#campaigns").click();
        cy.get("#create-template-button").click();
        cy.get("#name").type("Webhook1");
        cy.get("#handleTemplateType").click();
        cy.get('[data-option="webhook"]').click();
        cy.get("#submitTemplateCreation").click();
        cy.get("#webhookURL").type(
          `${Cypress.env("TESTS_API_BASE_URL")}/events`
        );
        cy.get("#custom-header").type(`Api-Key ${apikey}`);
        cy.contains("Content").click();

        cy.get("#webhook-body").type(
          JSON.stringify(
            {
              event: "webhook1",
              source: "custom",
              correlationKey: "email",
              correlationValue: email,
            },
            null,
            2
          )
        );
        cy.get("#saveDraftTemplate").click();
        cy.get(".invert").click();

        cy.get("#create-template-button").click();
        cy.get("#name").type("Webhook2");
        cy.get("#handleTemplateType").click();
        cy.get('[data-option="webhook"]').click();
        cy.get("#submitTemplateCreation").click();
        cy.get("#webhookURL").type(
          `${Cypress.env("TESTS_API_BASE_URL")}/events`
        );
        cy.get("#custom-header").type(`Api-Key ${apikey}`);
        cy.contains("Content").click();

        cy.get("#webhook-body").type(
          JSON.stringify(
            {
              event: "webhook2",
              source: "custom",
              correlationKey: "email",
              correlationValue: email,
            },
            null,
            2
          )
        );
        cy.get("#saveDraftTemplate").click();
        cy.get(".invert").click();

        cy.get("#journeys").click();
        cy.get("#create-journey").click();

        cy.get("#journey-name-input").clear().type("test00000");
        cy.get("#create-journey-modal-button").click();

        drag("#waitUntil", ".empty-node");
        cy.wait(500);
        cy.get(".text-muted").click();
        cy.get('[data-option="event"]').click();
        cy.get("input").clear().type("eventA");
        cy.contains("Save").click();
        cy.get("#save-node-data").click();

        drag("#multisplit", ".empty-node");
        cy.wait(500);
        cy.contains("Add branch").click();
        cy.contains("Add condition").click();
        cy.get("input:first").clear().type("mkt_agree");
        cy.contains("value").click();
        cy.get('[data-option="true"]').click();
        cy.get(':contains("Add"):last').click();
        cy.get("#save-node-data").click();

        drag("#webhook", ".empty-node:first");
        cy.wait(500);
        cy.get("#template-select").select(1);
        cy.get("#save-node-data").click();

        drag("#webhook", ".empty-node:last");
        cy.wait(500);
        cy.get("#template-select").select(2);
        cy.get("#save-node-data").click();

        cy.get("#next-button").click();
        cy.get("#next-button").click();
        cy.get("#next-button").click();
        cy.get("#start-journey-button").click();
        cy.get("#journey-start-verify-button").click();

        cy.contains("Journey has been started").should("exist");

        cy.wait(1000);

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
          cy.wait(1000);
          cy.reload();
          cy.get("#event-tracker").click();
          cy.contains("webhook2").should("exist");
        });
      });
  });
});
