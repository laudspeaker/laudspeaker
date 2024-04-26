import { format } from "date-fns";
import credentials from "../fixtures/credentials";
import createTestCustomer from "../test-helpers/createTestCustomer";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";
import setDate from "../test-helpers/setDate";
import setMailgun from "../test-helpers/setMailgun";
import { setupOrganization } from "../test-helpers/setupOrganization";
import signup from "../test-helpers/signup";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

describe("check dynamic inclusion with events", () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    signup(email, password, firstName, lastName);
    cy.wait(1000);
  });

  it("passes for once", () => {
    cy.viewport(1920, 1080);
    setupOrganization(organizationName, timeZone);
    createTestCustomer(email);

    cy.get("#personId")
      .invoke("text")
      .then((customerId) => {
        cy.get("#segments").click();
        cy.contains("Create Segment").click();
        cy.get('[data-testid="undefined-option-Dynamic rules"]').click();

        const segmentName = "Event segment";
        cy.get("#segmentName").type(segmentName);
        cy.get('[data-testid="filter-builder-add-condition-button"]').click();
        cy.get('[data-testid="undefined-button"] > .border').click();
        cy.get('[data-testid="undefined-option-Event"]').click();
        const eventName = "eventA";
        cy.get('[data-testid="attribute-statement-0"]').type(eventName);
        cy.get("#saveSegmentButton").click();
        cy.wait(1000);
        cy.reload();
        cy.contains("Eligible users: 0 Users").should("exist");

        cy.contains("Journeys").click();
        cy.get("#journeys").click();
        cy.get("#create-journey").click();

        cy.get("#journey-name-input").clear().type("test1");
        cy.get("#create-journey-modal-button").click();

        drag("#waitUntil", ".empty-node");
        cy.contains("Add branch").click();
        cy.get('[data-testid="undefined-option-Event"]').click();
        cy.get("#autoCompleteInput").type(eventName);
        cy.contains("Save").first().click();
        cy.get("#save-node-data").click();

        drag("#email", ".empty-node");
        cy.get("#template-select").select(1);
        cy.get("#save-node-data").click();

        cy.get("#next-button").click();
        cy.get(".gap-5 > .border").click();

        cy.get('[data-testid="undefined-button"] > .border').click();
        cy.get('[data-testid="undefined-option-Segment"]').click();
        cy.get("select:last").select(1);

        cy.get("#next-button").click();
        cy.get("#next-button").click();
        cy.get("#start-journey-button").click();
        cy.get("#journey-start-verify-button").click();

        cy.wait(1000);

        cy.get("#settings").click();
        cy.contains("API").click();
        cy.wait(1000);
        cy.get("#privateAPIKey")
          .invoke("val")
          .then((val) => {
            const apikey = val?.toString() || "no";

            cy.request({
              method: "POST",
              url: `${Cypress.env("TESTS_API_BASE_URL")}/events`,
              headers: { Authorization: `Api-Key ${apikey}` },
              body: {
                event: eventName,
                source: "custom",
                correlationKey: "_id",
                correlationValue: customerId,
              },
            }).then(() => {
              cy.wait(1000);
              cy.get("#segments").click();
              cy.contains(segmentName).click();
              cy.contains("Eligible users: 1 Users").should("exist");
            });
          });
      });
  });
});
