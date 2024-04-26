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

describe("check dynamic inclusion", () => {
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

    cy.get("#segments").click();
    cy.contains("Create Segment").click();
    cy.get('[data-testid="undefined-option-Dynamic rules"]').click();

    const segmentName = "Auto segment";
    cy.get("#segmentName").type(segmentName);
    cy.get('[data-testid="filter-builder-add-condition-button"]').click();
    cy.get('[data-testid="attribute-name-input-0"]').type("email");
    cy.get('[data-testid="attribute-statement-0"]').clear().type(email);
    cy.get("#saveSegmentButton").click();
    cy.wait(1000);
    cy.reload();
    cy.contains("Eligible users: 1 Users").should("exist");

    cy.contains("Journeys").click();
    cy.get("#journeys").click();
    cy.get("#create-journey").click();

    cy.get("#journey-name-input").clear().type("test1");
    cy.get("#create-journey-modal-button").click();

    drag("#email", ".empty-node");
    cy.get("#template-select").select(1);
    cy.get("#save-node-data").click();

    cy.get("#next-button").click();
    cy.get(".gap-5 > .border").click();
    cy.get('[data-testid="attribute-name-input-0"]').type("email");
    cy.get('[data-testid="attribute-statement-0"]').clear().type(email);
    cy.wait(1000);
    cy.contains("of users estimated reached ≈ 1").should("exist");

    cy.get("#next-button").click();
    cy.get("#next-button").click();
    cy.get("#start-journey-button").click();
    cy.get("#journey-start-verify-button").click();

    cy.contains("Journey has been started").should("exist");
    cy.wait(1000);
    cy.get("#journeys").click();
    cy.wait(1000);
    cy.contains("1 persons").should("exist");

    cy.get("#users").click();
    cy.get("#personIdLink").click();

    cy.contains("Edit").click();
    cy.get(".grid > .flex-col > .flex > .w-full").first().type("1");
    cy.contains("Save").click();

    cy.get("#segments").click();
    cy.contains(segmentName).click();
    cy.wait(1000);
    cy.contains("Eligible users: 0 Users").should("exist");

    cy.get("#journeys").click();
    cy.wait(1000);
    // still 1
    cy.contains("0 persons").should("exist");

    cy.get("#users").click();
    cy.get("#personIdLink").click();

    cy.contains("Edit").click();
    cy.get(".grid > .flex-col > .flex > .w-full").first().clear().type(email);
    cy.contains("Save").click();

    cy.get("#segments").click();
    cy.contains(segmentName).click();
    cy.wait(1000);
    cy.contains("Eligible users: 1 Users").should("exist");

    cy.get("#journeys").click();
    cy.wait(1000);
    cy.contains("1 persons").should("exist");

    cy.get("#users").click();
    cy.get("#personIdLink").click();

    cy.contains("Delete").click();
    cy.get('[label="Yes"]').click();

    cy.get("#segments").click();
    cy.contains(segmentName).click();
    cy.wait(1000);
    cy.contains("Eligible users: 0 Users").should("exist");

    cy.get("#journeys").click();
    cy.wait(1000);
    // still 1
    cy.contains("0 persons").should("exist");

    cy.get("#users").click();
    cy.get("#import-customer-button").click();
    cy.get('input[type="file"]').selectFile(
      "./cypress/fixtures/one-customer.csv",
      { force: true }
    );
    cy.wait(10000);

    cy.contains("one-customer").should("exist");
    cy.get("#next-button").click();
    cy.get("#next-button").click();
    cy.get('[data-testid="confirm-validation-button"]').click();
    cy.get("#next-button").click();
    cy.get('[data-testid="confirm-validation-button"]').click();
    // upload preview looks weird
    cy.get("#import-button").click();

    cy.wait(1000);
    cy.reload();

    cy.get("#personIdLink").should("exist");

    cy.get("#segments").click();
    cy.contains(segmentName).click();
    cy.wait(1000);
    cy.contains("Eligible users: 1 Users").should("exist");

    cy.contains("Journeys").click();
    cy.get("#journeys").click();
    cy.wait(1000);
    cy.contains("1 persons").should("exist");
  });
});
