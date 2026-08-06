import credentials from "../fixtures/credentials";
import createTestCustomer from "../test-helpers/createTestCustomer";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";
import setMailgun from "../test-helpers/setMailgun";
import { setupOrganization } from "../test-helpers/setupOrganization";
import signup from "../test-helpers/signup";
import { uploadCSV } from "../test-helpers/uploadCSV";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

describe("complex journey test 1", () => {
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
    createTestCustomer(email);

    uploadCSV("correctness_testing.csv");
    cy.get('[data-testid="undefined-button"]:nth(4)').click();
    cy.get('[data-option="_NEW_RECORD_;-;_NEW_RECORD_"]').click();
    cy.get("#fieldNameInput").type("isDeleted");
    cy.contains("Select type").click();
    cy.get('[data-testid="undefined-option-Boolean"]').click();
    cy.get("#saveAddAttributeModalButton").click();
    cy.get("#next-button").click();
    cy.get('[data-testid="confirm-validation-button"]').click();
    cy.get("#import-button").click();
    cy.wait(10000);
    cy.reload();

    cy.get("#settings").click();
    cy.contains("API").click();

    cy.wait(1000);

    cy.get("#privateAPIKey")
      .invoke("val")
      .then((apiKey) => {
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
        cy.get("#custom-header").type(`Api-Key ${apiKey}`);
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
        cy.contains("GET").click();
        cy.get('[data-option="POST"]').click();
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
        cy.get("#custom-header").type(`Api-Key ${apiKey}`);
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
        cy.contains("GET").click();
        cy.get('[data-option="POST"]').click();
        cy.get("#saveDraftTemplate").click();
        cy.get(".invert").click();

        cy.get("#create-template-button").click();
        cy.get("#name").type("Webhook3");
        cy.get("#handleTemplateType").click();
        cy.get('[data-option="webhook"]').click();
        cy.get("#submitTemplateCreation").click();
        cy.get("#webhookURL").type(
          `${Cypress.env("TESTS_API_BASE_URL")}/events`
        );
        cy.get("#custom-header").type(`Api-Key ${apiKey}`);
        cy.contains("Content").click();

        cy.get("#webhook-body").type(
          JSON.stringify(
            {
              event: "webhook3",
              source: "custom",
              correlationKey: "email",
              correlationValue: email,
            },
            null,
            2
          )
        );
        cy.contains("GET").click();
        cy.get('[data-option="POST"]').click();
        cy.get("#saveDraftTemplate").click();
        cy.get(".invert").click();

        cy.get("#journeys").click();
        cy.get("#create-journey").click();

        cy.get("#journey-name-input").clear().type("test1");
        cy.get("#create-journey-modal-button").click();

        drag("#timeDelay", ".empty-node");
        cy.get('[placeholder="Mins"]').type("1");
        cy.get("#save-node-data").click();

        drag("#multisplit", ".empty-node");
        cy.wait(500);
        cy.contains("Add branch").click();
        cy.contains("Add condition").click();
        cy.get("input:first").clear().type("isDeleted");
        cy.contains("value").click();
        cy.get('[data-option="true"]').click();
        cy.get(':contains("Add"):last').click();
        cy.get("#save-node-data").click();

        drag("#exit", ".empty-node:last");
        cy.get("#flow-builder-sidepanel-cancel").click({ force: true });

        drag("#multisplit", ".empty-node");

        cy.contains("Add branch").click();
        cy.contains("Add condition").click();
        cy.contains("Attribute").click();
        cy.get('[data-option="Event"]').click();
        cy.get('[data-testid="attribute-statement-0"]').clear().type("eventA");

        cy.get('[data-testid="filter-builder-add-condition-button"]').click();
        cy.contains("Attribute").click();
        cy.get('[data-option="Event"]').click();
        cy.get('[data-testid="attribute-statement-1"]').clear().type("eventB");

        cy.get('[data-testid="filter-builder-add-condition-button"]').click();
        cy.contains("Attribute").click();
        cy.get('[data-option="Event"]').click();
        cy.get('[data-testid="attribute-statement-2"]').clear().type("eventC");
        cy.get(':contains("Add"):last').click();
        cy.get("#save-node-data").click();

        drag("#exit", ".empty-node:last");
        cy.get("#flow-builder-sidepanel-cancel").click({ force: true });

        drag("#webhook", ".empty-node:last");
        cy.wait(500);
        cy.get("#template-select").select(1);
        cy.get("#save-node-data").click();

        drag("#timeDelay", ".empty-node");
        cy.get('[placeholder="Mins"]').type("1");
        cy.get("#save-node-data").click();

        drag("#webhook", ".empty-node:last");
        cy.wait(500);
        cy.get("#template-select").select(2);
        cy.get("#save-node-data").click();

        drag("#timeDelay", ".empty-node");
        cy.get('[placeholder="Mins"]').type("1");
        cy.get("#save-node-data").click();

        drag("#webhook", ".empty-node:last");
        cy.wait(500);
        cy.get("#template-select").select(3);
        cy.get("#save-node-data").click();

        drag("#experiment", ".empty-node:last");
        cy.wait(500);
        cy.contains("Add branch").click();
        cy.get("input:nth(0)").type("{selectall}").type("33");
        cy.get("input:nth(1)").last().type("{selectall}").type("33");
        cy.get("input:nth(2)").last().type("{selectall}").type("34");
        cy.get("#save-node-data").click();

        cy.get(".react-flow__controls-fitview").click({ force: true });

        drag("#webhook", ".empty-node:first", { fireDragOver: false });
        cy.wait(500);
        cy.get("#template-select").select(1);
        cy.get("#save-node-data").click();

        drag("#exit", ".empty-node:first", { fireDragOver: false });
        cy.get("#flow-builder-sidepanel-cancel").click({ force: true });
        cy.wait(500);

        drag("#webhook", ".empty-node:first", { fireDragOver: false });
        cy.wait(500);
        cy.get("#template-select").select(2);
        cy.get("#save-node-data").click();
        cy.wait(500);

        drag("#exit", ".empty-node:first", { fireDragOver: false });
        cy.get("#flow-builder-sidepanel-cancel").click({ force: true });
        cy.wait(500);

        cy.get(".react-flow__controls-fitview").click({ force: true });

        drag("#webhook", ".empty-node", { fireDragOver: false });
        cy.wait(500);
        cy.get("#template-select").select(3);
        cy.get("#save-node-data").click();
        cy.wait(500);

        drag("#exit", ".empty-node", { fireDragOver: false });
        cy.get("#flow-builder-sidepanel-cancel").click({ force: true });

        cy.get("#next-button").click();
        cy.get("#next-button").click();
        cy.get("#next-button").click();
        cy.get("#start-journey-button").click();
        cy.get("#journey-start-verify-button").click();

        cy.contains("Journey has been started").should("exist");
    });
  });
});
