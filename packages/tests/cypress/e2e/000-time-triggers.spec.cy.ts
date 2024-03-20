import credentials from "../fixtures/credentials";
import createTestCustomer from "../test-helpers/createTestCustomer";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";
import setMailgun from "../test-helpers/setMailgun";
import { setupOrganization } from "../test-helpers/setupOrganization";
import signup from "../test-helpers/signup";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

describe("time triggers", () => {
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
    setupOrganization(organizationName, timeZone);

    createTestCustomer(email);
    cy.wait(1000);
    cy.visit("/home");
    cy.url().should("include", "/home");

    cy.contains("Journeys").click();
    cy.contains("Journey Builder").click();
    cy.get("#create-journey").click();

    cy.get("#journey-name-input").clear().type("test1");
    cy.get("#create-journey-modal-button").click();

    drag("#timeDelay", ".empty-node");
    cy.get('[placeholder="Mins"]').type("1");
    cy.get("#save-node-data").click();

    drag("#timeWindow", ".last-empty-node:last", { fireDragOver: false });
    cy.wait(100);
    cy.get("#time-window-type-select").click();
    cy.get('[data-option="SpecWeekDays"]').click();
    cy.get("#time-window-week-day-option-1").click();
    cy.get("#time-window-week-day-option-2").click();
    cy.get("#time-window-week-day-option-3").click();
    cy.get("#time-window-week-day-option-4").click();
    cy.get("#time-window-week-day-option-5").click();
    cy.get("#save-node-data").click();

    drag("#email", ".last-empty-node:last", { fireDragOver: false });
    cy.get("#template-select").select("example-template-invoice");
    cy.get("#save-node-data").click();
    drag("#exit", ".last-empty-node:last", { fireDragOver: false });

    cy.get("#next-button").click();
    cy.get("#next-button").click();
    cy.get("#next-button").click();
    cy.get("#start-journey-button").click();
    cy.get("#journey-start-verify-button").click();

    cy.contains("Journey has been started").should("exist");
  });
});
