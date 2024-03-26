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

describe("eligible users", () => {
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
    cy.contains("Edit").click();

    cy.contains("Add attribute").click();
    cy.contains("mkt_agree").click();
    cy.contains("value").click();
    cy.get('[data-option="true"]').click();

    cy.contains("Add attribute").click();
    cy.contains("num").click();
    cy.get(".numberInput").type("1");

    cy.contains("Add attribute").click();
    cy.contains("str").click();
    const str = "This is string!";
    cy.get(".stringInput").type(str);

    cy.contains("Add attribute").click();
    cy.contains("numarr").click();
    cy.get(".grid > :nth-child(5) > .flex > .w-full").click();
    cy.get(".absolute > .flex-col > .bg-white").click();
    cy.get(".numberInput:last").type("1");
    cy.get(".absolute > .flex-col > .bg-white").click();
    cy.get(".numberInput:last").type("2");
    cy.get(".absolute > .flex-col > .bg-white").click();
    cy.get(".numberInput:last").type("3");
    cy.get(":contains(Save):last").click();

    cy.contains("Add attribute").click();
    cy.get(".h-full > :nth-child(2)").click();

    const date = new Date(Date.now() - 24 * 60 * 60 * 1000);

    cy.get(".dateInput").then(([input]) => {
      setDate(input as HTMLInputElement, format(date, "yyyy-MM-dd"));

      cy.contains("Save").click();

      cy.get("#segments").click();
      cy.contains("Create Segment").click();
      cy.get('[data-option="manual"]').click();
      cy.get(".w-fit > .border").type("Segment 1");
      cy.get('input[type="file"]').selectFile(
        "./cypress/fixtures/correctness_testing.csv",
        { force: true }
      );

      cy.wait(1000);

      cy.contains("correctness_testing").should("exist");
      cy.contains("Next").click();
      cy.contains("Select an attribute").first().click();
      cy.get('[data-option="_NEW_RECORD_;-;_NEW_RECORD_"]').click();
      cy.get(".w-fit > .border").type("name");
      cy.contains("Select type").click();
      cy.get('[data-option="String"]').click();
      cy.contains("Save").click();
      cy.contains("Next").click();
      cy.contains("Proceed").click();
      cy.contains("41").should("exist");
      cy.get(':contains("Import"):last').click();
      cy.get("#segments").click();
      cy.get("td:nth-of-type(1) > button").click();
      cy.wait(10000);
      cy.reload();
      cy.contains("Eligible users: 41 Users").should("exist");

      cy.get("#segments").click();
      cy.contains("Create Segment").click();
      cy.get('[data-option="automatic"]').click();

      cy.get("#segmentName").type("Segment 2");
      cy.get(".flex-nowrap > .bg-white").click();
      cy.get("input:nth(1)").type("email");
      cy.get("input:nth(2)").clear().type(email);
      cy.contains("Save").click();
      cy.wait(1000);
      cy.reload();
      cy.contains("Eligible users: 1 Users").should("exist");

      cy.contains("Journeys").click();
      cy.contains("Journey Builder").click();
      cy.get("#create-journey").click();
      cy.get("#journey-name-input").clear().type("test1");
      cy.get("#create-journey-modal-button").click();

      cy.get("#next-button").click();
      cy.get(".gap-5 > .border").click();
      cy.get(".filterBuilderAttributePicker").type("mkt_agree");
      cy.get(".booleanInput").click();
      cy.get('[data-option="true"]').click();
      cy.wait(5000);
      cy.contains("of users estimated reached ≈ 1").should("exist");

      cy.get(".filterBuilderAttributePicker").clear();
      cy.wait(5000);
      cy.get(".filterBuilderAttributePicker").type("email");
      cy.wait(5000);
      cy.get(".emailInput").clear().type(email, { waitForAnimations: true });
      cy.wait(5000);
      cy.contains("of users estimated reached ≈ 1").should("exist");

      cy.get(".filterBuilderAttributePicker").clear();
      cy.wait(5000);
      cy.get(".filterBuilderAttributePicker").type("num", {
        waitForAnimations: true,
      });
      cy.get(".numberInput").clear().type("0");
      cy.wait(5000);
      cy.contains("of users estimated reached ≈ 1").should("exist");

      cy.get(".filterBuilderAttributePicker").clear();
      cy.wait(5000);
      cy.get(".filterBuilderAttributePicker").type("str", {
        waitForAnimations: true,
      });
      cy.get(".stringInput").clear().type(str);
      cy.wait(5000);
      cy.contains("of users estimated reached ≈ 1").should("exist");

      cy.get(".filterBuilderAttributePicker").clear();
      cy.wait(5000);
      cy.get(".filterBuilderAttributePicker").type("numarr", {
        waitForAnimations: true,
      });
      cy.get("select:last").select(3);
      cy.get(".stringInput").clear().type("3");
      cy.wait(5000);
      cy.contains("of users estimated reached ≈ 1").should("exist");

      cy.contains("Attribute").click();
      cy.get('[data-option="Segment"]').click();

      cy.get("select:last").select(1);
      cy.wait(5000);
      cy.contains("of users estimated reached ≈ 41").should("exist");

      cy.get("select:last").select(2);
      cy.wait(5000);
      cy.contains("of users estimated reached ≈ 1").should("exist");
    });
  });
});
