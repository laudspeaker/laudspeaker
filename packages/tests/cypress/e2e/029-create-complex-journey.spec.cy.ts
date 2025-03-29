import credentials from "../fixtures/credentials";
import signup from "../test-helpers/signup";
import { uploadCSV } from "../test-helpers/uploadCSV";
import { simulatedEvents } from "../test-helpers/simulatedEvents";
import { mapAttributesToNewFields } from "../test-helpers/mapAttributesToNewFields";
import { setupOrganization } from "../test-helpers/setupOrganization";
import drag from "../test-helpers/drag";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

const testUsers = [
  { user_id: 492, name: "Bose", email: "testing+1@laudspeaker.com" },
  { user_id: 913, name: "Charawi", email: "testing+2@laudspeaker.com" },
  { user_id: 816, name: "Thaler", email: "testing+3@laudspeaker.com" },
];

const createWebhook = ({
  name = "WH_1",
  url = `${Cypress.env("TESTS_API_BASE_URL")}/events/`,
  token = "token",
  body = '{{} "foo": "bar" {}}',
}) => {
  cy.visit("/templates");
  cy.wait(1000);
  cy.get("#create-template-button").click();
  cy.get("#name").click();
  cy.get("#name").type(name);
  cy.get('[data-testid="select-button-button"]').click();
  cy.get("[data-option='webhook']").click();
  cy.get("#submitTemplateCreation").click();
  cy.get("#webhookURL").click();
  cy.get("#webhookURL").type(url);
  cy.get("#webhookMethod").click();
  cy.get('[data-testid="select-option-POST"]').click();
  cy.get("#authtype_custom").click();
  cy.get("#custom-header").type(token);
  cy.get('[data-testid="tab-Headers"]').click();
  cy.get("#add-header").click();
  cy.get("#custom-header-name-0").type("Content-Type");
  cy.get("#custom-header-value-0").type("application/json");
  cy.get('[data-testid="tab-Content"]').click();
  cy.get("#webhook-body").type(body);
  cy.get("#saveDraftTemplate").click();
};

const addExitNode = ({ target = "[data-testid='empty-node']" }) => {
  drag("#exit", target);
  cy.get("#flow-builder-sidepanel-cancel").click();
};

const addTimeDelayNode = () => {
  cy.wait(2000);
  drag("#timeDelay", "[data-testid='empty-node']", { fireDragOver: false });
  cy.get("[data-testid='time-delay-minutes']").type("1");
  cy.get("#save-node-data").click();
};

const addWebhookNode = ({
  webhook = "WH_1",
  target = "[data-testid='empty-node']",
}) => {
  cy.wait(2000);
  drag("#webhook", target, { fireDragOver: false });
  cy.get("#template-select").select(webhook);
  cy.get("#save-node-data").click();
};

const zoomOut = () => {
  cy.get(".react-flow__controls-zoomout").click();
};

describe("Create complex journey", () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    signup(email, password, firstName, lastName);
    cy.wait(1000);

    setupOrganization(organizationName, timeZone);
    cy.wait(1000);

    cy.visit("/home");
    cy.url().should("include", "/home");
  });

  it("works as expected", { retries: 3 }, () => {
    cy.wait(1000);

    uploadCSV("correctness_testing.csv");
    mapAttributesToNewFields();
    cy.get("#next-button").click();
    cy.get("[data-testid='confirm-validation-button']").click();

    cy.get("#import-button", { timeout: 30000 }).click();
    cy.contains("Import started").should("be.visible");

    cy.wait(5000);
    cy.reload();

    cy.visit("/settings");
    cy.contains("API").click();
    cy.wait(1000);

    // Get API key, fire events and create webhooks
    cy.get('input[name="privateAPIKey"]').then(($input) => {
      const APIKey = $input.val() as string;
      expect(APIKey).to.be.a("string").and.not.be.empty;

      testUsers.forEach(({ email }, idx) => {
        cy.wait(1000);
        simulatedEvents(
          `${Cypress.env("TESTS_API_BASE_URL")}/events/`,
          APIKey,
          {
            correlationKey: "email",
            correlationValue: email,
            source: "custom",
            event: `Event ${idx + 1}`,
            payload: { example: 4 },
          }
        );

        // create webhooks inside here instead of creating another loop
        createWebhook({
          name: `WH_${idx + 1}`,
          token: `Api-Key ${APIKey}`,
          body: `{{}"source":"custom","event":"${email} event","payload":{{}"foo":"bar"{}},"correlationKey":"email","correlationValue":"${email}"{}}`,
        });
      });

      // Confirm Events were fired
      cy.visit("/event-tracker");
      cy.wait(1000);
      cy.contains("Event 1").should("be.visible");
      cy.contains("Event 2").should("be.visible");
      cy.contains("Event 3").should("be.visible");

      cy.wait(1000);
      cy.get('[data-testid="row-0"]').click();
      cy.contains("testing+3@laudspeaker.com").should("be.visible");
    });

    cy.visit("/flow");
    cy.get("#create-journey").click();
    cy.get("#journey-name-input").clear().type("complex-journey-test");
    cy.get("#create-journey-modal-button").click();

    addTimeDelayNode();

    drag("#multisplit", "[data-testid='empty-node']", { fireDragOver: false });
    cy.get("button").contains("Add branch").click();
    cy.get('[data-testid="filter-builder-add-condition-button"]').click();
    cy.get('[data-testid="attribute-name-input-0"]').type("is_own_car");
    cy.get("[data-testid='combobox-option-is_own_car']").click();
    cy.get("[data-testid='attribute-statement-select-0']").select(
      "Boolean;;is equal to"
    );
    cy.get("[data-testid='attribute-statement-0-boolean-button']").click();
    cy.get("[data-testid='attribute-statement-0-boolean-option-true']").click();
    cy.get("[data-testid='flow-builder-multisplit-add-button']").click();
    cy.get("#save-node-data").click();

    addExitNode({ target: "[data-testid='empty-node']:last" });

    drag("#multisplit", "[data-testid='empty-node']", { fireDragOver: false });
    cy.get("button").contains("Add branch").click();

    cy.get('[data-testid="filter-builder-condition-select"]').select("All");

    // condition #1
    cy.get('[data-testid="filter-builder-add-condition-button"]').click();
    cy.get('[data-testid="select-button"] > .border').click();
    cy.get('[data-testid="select-option-Event"]').click();
    cy.get('[data-testid="attribute-statement-0"]').type("a_loan_list");

    // condition #2
    cy.get('[data-testid="filter-builder-add-condition-button"]').click();
    cy.get('[data-testid="select-button"] > .border:last').click();
    cy.get('[data-testid="select-option-Event"]').click();
    cy.get('[data-testid="attribute-statement-1"]').type("b_loan_list");

    // condition #3
    cy.get('[data-testid="filter-builder-add-condition-button"]').click();
    cy.get('[data-testid="select-button"] > .border:last').click();
    cy.get('[data-testid="select-option-Event"]').click();
    cy.get('[data-testid="attribute-statement-2"]').type("c_loan_list");

    cy.get("[data-testid='flow-builder-multisplit-add-button']").click();
    cy.get("#save-node-data").click();

    addExitNode({ target: "[data-testid='empty-node']:last" });

    cy.wait(2000);

    zoomOut();
    zoomOut();

    addWebhookNode({ webhook: "WH_1", target: "[data-testid='empty-node']" });
    addTimeDelayNode();
    addWebhookNode({ webhook: "WH_2", target: "[data-testid='empty-node']" });
    addTimeDelayNode();
    addWebhookNode({ webhook: "WH_3", target: "[data-testid='empty-node']" });

    cy.wait(2000);
    drag("#experiment", "[data-testid='empty-node']", { fireDragOver: false });
    cy.get("#experiment-add-branch").click();

    cy.wait(1000);
    cy.get("[data-testid='branch-1-hours']").invoke("val", "").type("33");
    cy.get("[data-testid='branch-2-hours']").invoke("val", "").type("33");
    cy.get("[data-testid='branch-3-hours']").invoke("val", "").type("34");
    cy.get("#save-node-data").click();

    cy.get(".react-flow__controls-fitview").click();

    addWebhookNode({
      webhook: "WH_1",
      target: "[data-testid='empty-node']:first",
    });
    addWebhookNode({
      webhook: "WH_2",
      target: "[data-testid='empty-node']:nth(1)",
    });
    addWebhookNode({
      webhook: "WH_3",
      target: "[data-testid='empty-node']:nth(2)",
    });

    cy.wait(2000);
    addExitNode({ target: "[data-testid='empty-node']:first" });
    addExitNode({ target: "[data-testid='empty-node']:nth(0)" });
    addExitNode({ target: "[data-testid='empty-node']" });

    cy.get("#next-button").click();
    cy.wait(1000);

    cy.get("#next-button").click();
    cy.wait(1000);

    cy.get("#next-button").click();
    cy.wait(1000);

    cy.get("#start-journey-button").click();
    cy.wait(1000);

    cy.get("#journey-start-verify-button").click();
  });
});
