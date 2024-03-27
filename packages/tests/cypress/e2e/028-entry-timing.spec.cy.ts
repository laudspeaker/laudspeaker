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

describe("upload from csv", () => {
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

    cy.contains("Journeys").click();
    cy.contains("Journey Builder").click();
    cy.get("#create-journey").click();

    cy.get("#journey-name-input").clear().type("test1");
    cy.get("#create-journey-modal-button").click();

    drag("#email", ".empty-node");
    cy.get("#template-select").select(1);
    cy.get("#save-node-data").click();

    cy.get("#next-button").click();
    cy.contains("Enter users at specific time").click();
    cy.get("input:first").then(([input]) => {
      const date = new Date(
        Date.now() + 60 * 1000 + new Date().getTimezoneOffset() * 60 * 1000
      );

      setDate(
        input as HTMLInputElement,
        format(date, "yyyy-MM-dd") + "T" + format(date, "hh:mm")
      );

      cy.get("#next-button").click();
      cy.get("#next-button").click();
      cy.get("#start-journey-button").click();
      cy.get("#journey-start-verify-button").click();

      cy.contains("Journey has been started").should("exist");
      cy.wait(1000);
      cy.get("#journeys").click();
      cy.contains("0 persons").should("exist");

      cy.wait(60 * 1000);
      cy.reload();

      cy.contains("1 persons").should("exist");
    });
  });

  it("passes for every 12 days, ends never", () => {
    cy.viewport(1920, 1080);
    setupOrganization(organizationName, timeZone);
    createTestCustomer(email);

    cy.contains("Journeys").click();
    cy.contains("Journey Builder").click();
    cy.get("#create-journey").click();

    cy.get("#journey-name-input").clear().type("test1");
    cy.get("#create-journey-modal-button").click();

    drag("#email", ".empty-node");
    cy.get("#template-select").select(1);
    cy.get("#save-node-data").click();

    cy.get("#next-button").click();
    cy.contains("Enter users at specific time").click();

    cy.get("select:first").select(1);

    cy.get("input:last").type("2");

    cy.get("#next-button").click();
    cy.get("#next-button").click();
    cy.get("#start-journey-button").click();
    cy.get("#journey-start-verify-button").click();

    cy.contains("Journey has been started").should("exist");
    cy.wait(1000);
    cy.get("#journeys").click();
    cy.contains("0 persons").should("exist");
  });

  it("passes for every 12 days, ends after 13 occurances", () => {
    cy.viewport(1920, 1080);
    setupOrganization(organizationName, timeZone);
    createTestCustomer(email);

    cy.contains("Journeys").click();
    cy.contains("Journey Builder").click();
    cy.get("#create-journey").click();

    cy.get("#journey-name-input").clear().type("test1");
    cy.get("#create-journey-modal-button").click();

    drag("#email", ".empty-node");
    cy.get("#template-select").select(1);
    cy.get("#save-node-data").click();

    cy.get("#next-button").click();
    cy.contains("Enter users at specific time").click();

    cy.get("select:first").select(1);

    cy.get("input:last").type("2");

    cy.get("select:last").select(1);
    cy.get("input:last").type("3");

    cy.get("#next-button").click();
    cy.get("#next-button").click();
    cy.get("#start-journey-button").click();
    cy.get("#journey-start-verify-button").click();

    cy.contains("Journey has been started").should("exist");
    cy.wait(1000);
    cy.get("#journeys").click();
    cy.contains("0 persons").should("exist");
  });

  it("passes for every 12 days, ends on a specific date", () => {
    cy.viewport(1920, 1080);
    setupOrganization(organizationName, timeZone);
    createTestCustomer(email);

    cy.contains("Journeys").click();
    cy.contains("Journey Builder").click();
    cy.get("#create-journey").click();

    cy.get("#journey-name-input").clear().type("test1");
    cy.get("#create-journey-modal-button").click();

    drag("#email", ".empty-node");
    cy.get("#template-select").select(1);
    cy.get("#save-node-data").click();

    cy.get("#next-button").click();
    cy.contains("Enter users at specific time").click();

    cy.get("select:first").select(1);

    cy.get("input:last").type("2");

    cy.get("select:last").select(2);

    cy.get("input:last").then(([input]) => {
      const date = new Date(
        Date.now() +
          2 * 24 * 60 * 60 * 1000 +
          new Date().getTimezoneOffset() * 60 * 1000
      );
      setDate(
        input as HTMLInputElement,
        format(date, "yyyy-MM-dd") + "T" + format(date, "hh:mm")
      );

      cy.get("#next-button").click();
      cy.get("#next-button").click();
      cy.get("#start-journey-button").click();
      cy.get("#journey-start-verify-button").click();

      cy.contains("Journey has been started").should("exist");
      cy.wait(1000);
      cy.get("#journeys").click();
      cy.contains("0 persons").should("exist");
    });
  });

  it("passes for weekly on Wen, ends never", () => {
    cy.viewport(1920, 1080);
    setupOrganization(organizationName, timeZone);
    createTestCustomer(email);

    cy.contains("Journeys").click();
    cy.contains("Journey Builder").click();
    cy.get("#create-journey").click();

    cy.get("#journey-name-input").clear().type("test1");
    cy.get("#create-journey-modal-button").click();

    drag("#email", ".empty-node");
    cy.get("#template-select").select(1);
    cy.get("#save-node-data").click();

    cy.get("#next-button").click();
    cy.contains("Enter users at specific time").click();

    cy.get("select:first").select(2);
    cy.get("#next-button").click();
    cy.get("#next-button").click();
    cy.get("#start-journey-button").click();
    cy.get("#journey-start-verify-button").click();

    cy.contains("Journey has been started").should("exist");
    cy.wait(1000);
    cy.get("#journeys").click();
    cy.contains("0 persons").should("exist");
  });

  it("passes for every 2 weeks on Wen, ends never", () => {
    cy.viewport(1920, 1080);
    setupOrganization(organizationName, timeZone);
    createTestCustomer(email);

    cy.contains("Journeys").click();
    cy.contains("Journey Builder").click();
    cy.get("#create-journey").click();

    cy.get("#journey-name-input").clear().type("test1");
    cy.get("#create-journey-modal-button").click();

    drag("#email", ".empty-node");
    cy.get("#template-select").select(1);
    cy.get("#save-node-data").click();

    cy.get("#next-button").click();
    cy.contains("Enter users at specific time").click();

    cy.get("select:first").select(2);
    cy.get("input:last").type("{selectall}").type("2");

    cy.get("#next-button").click();
    cy.get("#next-button").click();
    cy.get("#start-journey-button").click();
    cy.get("#journey-start-verify-button").click();

    cy.contains("Journey has been started").should("exist");
    cy.wait(1000);
    cy.get("#journeys").click();
    cy.contains("0 persons").should("exist");
  });

  it("passes for every month, ends never", () => {
    cy.viewport(1920, 1080);
    setupOrganization(organizationName, timeZone);
    createTestCustomer(email);

    cy.contains("Journeys").click();
    cy.contains("Journey Builder").click();
    cy.get("#create-journey").click();

    cy.get("#journey-name-input").clear().type("test1");
    cy.get("#create-journey-modal-button").click();

    drag("#email", ".empty-node");
    cy.get("#template-select").select(1);
    cy.get("#save-node-data").click();

    cy.get("#next-button").click();
    cy.contains("Enter users at specific time").click();

    cy.get("select:first").select(3);

    cy.get("#next-button").click();
    cy.get("#next-button").click();
    cy.get("#start-journey-button").click();
    cy.get("#journey-start-verify-button").click();

    cy.contains("Journey has been started").should("exist");
    cy.wait(1000);
    cy.get("#journeys").click();
    cy.contains("0 persons").should("exist");
  });

  it("passes for every 2 months, ends never", () => {
    cy.viewport(1920, 1080);
    setupOrganization(organizationName, timeZone);
    createTestCustomer(email);

    cy.contains("Journeys").click();
    cy.contains("Journey Builder").click();
    cy.get("#create-journey").click();

    cy.get("#journey-name-input").clear().type("test1");
    cy.get("#create-journey-modal-button").click();

    drag("#email", ".empty-node");
    cy.get("#template-select").select(1);
    cy.get("#save-node-data").click();

    cy.get("#next-button").click();
    cy.contains("Enter users at specific time").click();

    cy.get("select:first").select(3);
    cy.get("input:last").type("{selectall}").type("2");

    cy.get("#next-button").click();
    cy.get("#next-button").click();
    cy.get("#start-journey-button").click();
    cy.get("#journey-start-verify-button").click();

    cy.contains("Journey has been started").should("exist");
    cy.wait(1000);
    cy.get("#journeys").click();
    cy.contains("0 persons").should("exist");
  });
});
