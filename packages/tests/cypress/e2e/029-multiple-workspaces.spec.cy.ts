import credentials from "../fixtures/credentials";
import createTestCustomer from "../test-helpers/createTestCustomer";
import drag from "../test-helpers/drag";
import { loginFunc } from "../test-helpers/loginFunc";
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

  it("passes", () => {
    cy.viewport(1920, 1080);
    setupOrganization(organizationName, timeZone);
    createTestCustomer(email);

    cy.get("#settings").click();
    cy.get("input")
      .first()
      .should("have.value", `${organizationName} workspace`);
    cy.contains("API").click();

    cy.wait(1000);
    cy.get("#privateAPIKey")
      .invoke("val")
      .then((workspace1ApiKey) => {
        cy.contains("Journeys").click();
        cy.get("#journeys").click();

        const workspace1JourneyName = "Example onboarding checklist";
        cy.contains(workspace1JourneyName).should("exist");

        cy.get('[data-testid="workspace-picker-btn"]').click();
        cy.get('[data-testid="manage-account-btn"]').click();
        cy.contains("Manage workspace").click();
        cy.contains("Create workspace").click();

        cy.get("input").type("workspace2");
        cy.contains("Save").click();
        cy.get('[data-testid="workspace-picker-btn"]').click();
        cy.get('[data-testid="workspace-1"]').click();
        cy.wait(1000);
        cy.get('[data-testid="drawer-back-btn"]').click();

        cy.get("#settings").click();
        cy.get("input").first().should("have.value", `workspace2`);

        cy.contains("API").click();

        cy.wait(1000);
        cy.get("#privateAPIKey")
          .invoke("val")
          .then((workspace2ApiKey) => {
            assert(workspace1ApiKey !== workspace2ApiKey);

            cy.contains("Journeys").click();
            cy.get("#journeys").click();
            cy.contains(workspace1JourneyName).should("not.exist");

            cy.get("#create-journey").click();
            const workspace2JourneyName = "workspace2JourneyName";
            cy.get("#journey-name-input").type(workspace2JourneyName);
            cy.get("#create-journey-modal-button").click();
            cy.get("#campaigns").click();
            cy.get("#create-template-button").click();

            const workspace2TemplateName = "temp";
            cy.get("#name").type(workspace2TemplateName);
            cy.get("#submitTemplateCreation").click();
            cy.get("#saveDraftTemplate").click();

            cy.get('[data-testid="workspace-picker-btn"]').click();
            cy.get('[data-testid="workspace-0"]').click();

            cy.wait(1000);

            cy.get("#campaigns").click();
            cy.contains("workspace2TemplateName").should("not.exist");
            cy.get("#journeys").click();
            cy.contains(workspace2JourneyName).should("not.exist");
          });
      });
  });
});
