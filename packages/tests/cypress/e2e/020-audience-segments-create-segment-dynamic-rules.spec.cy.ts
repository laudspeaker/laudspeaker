import credentials from "../fixtures/credentials";
import signup from "../test-helpers/signup";
import { setupOrganization } from "../test-helpers/setupOrganization";
import { uploadCSV } from "../test-helpers/uploadCSV";
import { mapAttributesToNewFields } from "../test-helpers/mapAttributesToNewFields";
import {
  booleanSegments,
  createNewDynamicSegment,
  dateSegments,
  emailSegments,
  numberSegments,
  stringSegments,
} from "../test-helpers/createNewDynamicSegment";
import { add } from "cypress/types/lodash";

const { email, password, firstName, lastName, organizationName, timeZone } =
  credentials;

describe("Segment Correctness", () => {
  beforeEach(() => {
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
  });

  it("works as expected", () => {
    uploadCSV("correctness_testing.csv");

    mapAttributesToNewFields();
    cy.get("[data-testid='next-button']").click();
    cy.get("[data-testid='confirm-validation-button']").click();

    cy.get("[data-testid='import-button']", { timeout: 20000 }).click();
    cy.contains("Import started").should("be.visible");

    // Create string segments
    stringSegments.forEach(createNewDynamicSegment);
    cy.wait(5000);

    // Create number segments
    numberSegments.forEach(createNewDynamicSegment);
    cy.wait(5000);

    // Create boolean segments
    booleanSegments.forEach(createNewDynamicSegment);
    cy.wait(5000);

    // create email segments
    emailSegments.forEach(createNewDynamicSegment);
    cy.wait(5000);

    // create date segments
    // FIXME: date comparisons are failing despite having users
    // matching the conditions
    // dateSegments.forEach(createNewDynamicSegment);
  });
});
