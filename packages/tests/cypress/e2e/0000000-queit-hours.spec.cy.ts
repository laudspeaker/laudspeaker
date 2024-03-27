import { format } from "date-fns";
import credentials from "../fixtures/credentials";
import createTestCustomer from "../test-helpers/createTestCustomer";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";
import { setupOrganization } from "../test-helpers/setupOrganization";
import setupQuietHours from "../test-helpers/setupQuietHours";
import signup from "../test-helpers/signup";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

describe("quiet hours", () => {
  beforeEach(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    signup(email, password, firstName, lastName);
    cy.wait(1000);
  });

  it("aborts message when quiet hours is set and now is quiet hour", () => {
    setupOrganization(organizationName, timeZone);

    createTestCustomer(email);
    cy.wait(1000);
    cy.visit("/home");
    cy.url().should("include", "/home");

    cy.contains("Journeys").click();
    cy.contains("Journey Builder").click();
    cy.get("#create-journey").click();

    cy.get("#journey-name-input").clear().type("quietHoursTest1");
    cy.get("#create-journey-modal-button").click();

    drag("#email", ".empty-node");
    cy.get("#template-select").select("example-template-invoice");
    cy.get("#save-node-data").click();
    drag("#exit", ".last-empty-node:last", { fireDragOver: false });

    cy.get("#next-button").click();
    cy.get("#next-button").click();

    const nowDate = new Date();

    const offset = 3;
    const hourInMs = 60 * 60 * 1000;

    const startDate = new Date(nowDate.getTime() - offset * hourInMs);
    const endDate = new Date(nowDate.getTime() + offset * hourInMs);

    setupQuietHours(format(startDate, "HH:mm"), format(endDate, "HH:mm"));

    cy.get("#next-button").click();
    cy.get("#start-journey-button").click();
    cy.get("#journey-start-verify-button").click();

    cy.wait(10000);
    cy.reload();
    cy.wait(5000);
    cy.get(".sent > .stat-result").contains("0");
  });

  it("doesn't abort message when quiet hours is set and now is quiet hour", () => {
    setupOrganization(organizationName, timeZone);

    createTestCustomer(email);
    cy.wait(1000);
    cy.visit("/home");
    cy.url().should("include", "/home");

    cy.contains("Journeys").click();
    cy.contains("Journey Builder").click();
    cy.get("#create-journey").click();

    cy.get("#journey-name-input").clear().type("quietHoursTest1");
    cy.get("#create-journey-modal-button").click();

    drag("#email", ".empty-node");
    cy.get("#template-select").select("example-template-invoice");
    cy.get("#save-node-data").click();
    drag("#exit", ".last-empty-node:last", { fireDragOver: false });

    cy.get("#next-button").click();
    cy.get("#next-button").click();

    const nowDate = new Date();

    const offset = 3;
    const hourInMs = 60 * 60 * 1000;

    const startDate = new Date(nowDate.getTime() - 2 * offset * hourInMs);
    const endDate = new Date(nowDate.getTime() - offset * hourInMs);

    setupQuietHours(format(startDate, "HH:mm"), format(endDate, "HH:mm"));

    cy.get("#next-button").click();
    cy.get("#start-journey-button").click();
    cy.get("#journey-start-verify-button").click();

    cy.wait(10000);
    cy.reload();
    cy.wait(5000);
    cy.get(".sent > .stat-result").contains("1");
  });
});
