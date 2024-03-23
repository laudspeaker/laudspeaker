import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";
import signup from "../test-helpers/signup";
// import {loginFunc} from "../test-helpers/loginFunc";
import { setupOrganization } from "../test-helpers/setupOrganization";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

const createWebhook = (
  name = "WH_1",
  url = "https://jsonplaceholder.typicode.com/todos/1"
) => {
  cy.visit("http://localhost:3000/templates");
  cy.wait(1000);
  cy.get("#create-template-button").click();
  cy.get("#name").click();
  cy.get("#name").type(name);
  cy.get("[data-testid='select-button']").click();
  cy.get("[data-option='webhook']").click();
  cy.get("#submitTemplateCreation").click();
  cy.get("#webhookURL").click();
  cy.get("#webhookURL").type(url);
  cy.get("#saveDraftTemplate").click();
};

const drag = (from: string, to = "[data-testid='empty-node']") => {
  cy.get(from).trigger("dragstart", {
    dataTransfer: {
      dropEffect: "move",
      setData: (key: string, value: string) => {
        console.log(key, value);
      },
    },
    force: true,
  });
  cy.get(to)
    .eq(0)
    .trigger("dragover", {
      dataTransfer: { dropEffect: "move" },
      force: true,
    });
  cy.get(to)
    .eq(0)
    .trigger("drop", {
      dataTransfer: {
        getData(action: string) {
          // remove first character from `from` to get the action
          if (action === "action") return from.slice(1);
        },
      },
      force: true,
    });
};

const addWebhook = (position = 1) => {
  cy.wait(1000);
  drag("#webhook");

  cy.contains(`Webhook ${position}`).click({ force: true });
  cy.get("#template-select").select("WH_1");
  cy.get("#save-node-data").click();

  cy.wait(1000);
  drag("#exit");

  cy.get("#flow-builder-sidepanel-cancel").click({ force: true });
};

const testValues: Record<string, string> = {
  user_id: "913",
  name: "Bose",
  email: "testing+3@laudspeaker.com",
  is_delete: "true",
  recent_appl_date: "2011-12-11",
};

const triggerEvent = (
  APIKey: string,
  event: string,
  correlationKey: string,
  correlationValue: string
) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("TESTS_API_BASE_URL")}/events/`,
    headers: {
      Authorization: `Api-Key ${APIKey}`,
      "Content-Type": "application/json",
    },
    body: {
      source: "custom",
      event,
      payload: {
        foo: "bar",
      },
      correlationKey,
      correlationValue,
    },
  }).then((response) => {
    expect(response.status).to.eq(201);
  });
};

describe("Comprehensive MultiSplit", { retries: 2 }, () => {
  beforeEach(() => {
    try {
      cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
      cy.wait(1000);
      cy.clearAllCookies();
      cy.clearAllLocalStorage();
      cy.clearAllSessionStorage();
      signup(email, password, firstName, lastName);
      cy.wait(1000);
      setupOrganization(organizationName, timeZone);
      cy.wait(10000);
      cy.visit("/home");
      cy.url().should("include", "/home");
      // loginFunc(email, password);
    } catch (e) {
      console.log(e);
    }
  });

  it("works as expected", () => {
    cy.uploadCSV();

    // create webhook
    createWebhook();

    // create multi-split journey
    cy.visit("http://localhost:3000/flow");
    cy.get("#create-journey").click();
    cy.get("#journey-name-input").click();
    cy.get("#journey-name-input").type("TM_2");
    cy.get("#create-journey-modal-button").click();

    // Drag & Drop WaitUntil node
    cy.wait(1000);
    drag("#waitUntil");

    // Set Max Time
    cy.get("#set-max-time").click();
    cy.get("[data-testid='time-delay-minutes']").click();
    cy.get("[data-testid='time-delay-minutes']").type("1");
    cy.get("#save-node-data").click();

    // Add multispit node
    cy.wait(1000);
    drag("#multisplit");

    // Add Branches
    cy.get("[data-testid='multisplit-add-branch-button']").click();
    cy.get("[data-testid='filter-builder-add-condition-button']").click();

    // branch #1
    cy.get("[data-testid='attribute-name-input-0']").click();
    cy.get("[data-testid='attribute-name-input-0']").type("name");
    cy.get("[data-testid='combobox-option-name']").click();
    cy.get("[data-testid='attribute-statement-0']").type("john");
    cy.get("[data-testid='flow-builder-multisplit-add-button']").click();

    // branch #2
    cy.get("[data-testid='multisplit-add-branch-button']").click();
    cy.get("[data-testid='filter-builder-add-condition-button']").click();
    cy.get("[data-testid='attribute-name-input-0']").type("email");
    cy.get("[data-testid='combobox-option-email']").click();
    cy.get("[data-testid='attribute-statement-0']").type("user@email.com");
    cy.get("[data-testid='flow-builder-multisplit-add-button']").click();

    // branch #3
    cy.get("[data-testid='multisplit-add-branch-button']").click();
    cy.get("[data-testid='filter-builder-add-condition-button']").click();
    cy.get("[data-testid='attribute-name-input-0']").type("is_own_car");
    cy.get("[data-testid='combobox-option-is_own_car']").click();
    cy.get("[data-testid='attribute-statement-select-0']").select(
      "Boolean;;is equal to"
    );
    cy.get("[data-testid='attribute-statement-0-boolean-button']").click();
    cy.get("[data-testid='attribute-statement-0-boolean-option-true']").click();
    cy.get("[data-testid='flow-builder-multisplit-add-button']").click();

    //  branch #4
    cy.get("[data-testid='multisplit-add-branch-button']").click();
    cy.get("[data-testid='filter-builder-add-condition-button']").click();
    cy.get("[data-testid='attribute-name-input-0']").type("recent_repay_amt");
    cy.get("[data-testid='combobox-option-recent_repay_amt']").click();
    cy.get("[data-testid='attribute-statement-select-0']").select(
      "Number;;is greater than"
    );
    cy.get("[data-testid='attribute-statement-0']").click();
    cy.get("[data-testid='attribute-statement-0']").type("10");
    cy.get("[data-testid='flow-builder-multisplit-add-button']").click();

    //  branch #5
    cy.get("[data-testid='multisplit-add-branch-button']").click();
    cy.get("[data-testid='filter-builder-add-condition-button']").click();
    cy.get("[data-testid='attribute-name-input-0']").type("recent_appl_date");
    cy.get("[data-testid='combobox-option-recent_appl_date']").click();
    cy.get("[data-testid='attribute-statement-select-0']").select(
      "Date;;before"
    );
    cy.get("[data-testid='attribute-statement-0']").type("2010-02-12");

    cy.get("[data-testid='flow-builder-multisplit-add-button']").click();
    cy.get("#save-node-data").click();

    addWebhook(1);
    addWebhook(2);
    addWebhook(3);
    addWebhook(4);
    addWebhook(5);

    // Go to /settings
    cy.visit("/settings");
    cy.contains("API").click();
    cy.wait(1000);

    cy.get('input[name="privateAPIKey"]').then(($input) => {
      // Get the input value
      const APIKey = $input.val() as string;
      expect(APIKey).to.be.a("string").and.not.be.empty;

      for (const key in testValues) {
        cy.wait(1000);
        triggerEvent(APIKey, `${key} event`, key, testValues[key]);
      }
    });

    cy.visit("/event-tracker");
    cy.wait(1000);

    for (const key in testValues) {
      cy.wait(1000);
      cy.contains(`${key} event`);
    }
  });
});
