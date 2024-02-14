// import credentials from "../fixtures/credentials";
// import createTestCustomer from "../test-helpers/createTestCustomer";
// import drag from "../test-helpers/drag";
// import { loginFunc } from "../test-helpers/loginFunc";
// import setMailgun from "../test-helpers/setMailgun";
// import { setupOrganization } from "../test-helpers/setupOrganization";
// import signup from "../test-helpers/signup";

// const { email, password, firstName, lastName, organizationName, timeZone } =
//   credentials;

// describe("test2", () => {
//   beforeEach(() => {
//     cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
//     cy.wait(2000);
//     cy.clearAllCookies();
//     cy.clearAllLocalStorage();
//     cy.clearAllSessionStorage();
//     signup(email, password, firstName, lastName);
//     cy.wait(1000);
//   });

//   it("passes", () => {
//     cy.viewport(1920, 1080);
//     setupOrganization(organizationName, timeZone);

//     setMailgun();
//     createTestCustomer(email);
//     cy.wait(1000);
//     cy.visit("/home");
//     cy.url().should("include", "/home");

//     cy.contains("Journeys").click();
//     cy.contains("Journey Builder").click();
//     cy.get("#create-journey").click();

//     cy.get("#journey-name-input").clear().type("test2");
//     cy.get("#create-journey-modal-button").click();

//     drag("#timeDelay", ".empty-node");
//     cy.get('[placeholder="Mins"]').type("1");
//     cy.get("#save-node-data").click();

//     drag("#timeWindow", ".last-empty-node:last", { fireDragOver: false });
//     cy.wait(100);
//     cy.get("#time-window-type-select").click();
//     cy.get('[data-option="SpecWeekDays"]').click();
//     cy.get("#time-window-week-day-option-1").click();
//     cy.get("#time-window-week-day-option-2").click();
//     cy.get("#time-window-week-day-option-3").click();
//     cy.get("#time-window-week-day-option-4").click();
//     cy.get("#time-window-week-day-option-5").click();
//     cy.get("#save-node-data").click();

//     drag("#multisplit", ".last-empty-node:last", { fireDragOver: false });
//     ["0.2", "0.5", "1"].forEach((el) => {
//       cy.contains("Add branch").click();
//       cy.get(".flex-nowrap > .bg-white").click();
//       cy.get("input:first").type("c");
//       cy.get("select:last").select("is less than");
//       cy.get("input:last").clear().type(el);
//       cy.get(':contains("Add"):last').click();
//     });
//     cy.get("#save-node-data").click();

//     [1, 2, 3, 4].forEach((emailTemplate) => {
//       drag("#email", ".last-empty-node:last", { fireDragOver: false });
//       cy.get("#template-select").select(emailTemplate);
//       cy.get("#save-node-data").click();
//       drag("#exit", ".last-empty-node:last", { fireDragOver: false });
//       cy.get("#flow-builder-sidepanel-cancel").click({ force: true });
//       cy.get(".react-flow__controls-fitview").click();
//     });

//     cy.get("#next-button").click();
//     cy.get("#next-button").click();
//     cy.get("#next-button").click();
//     cy.get("#start-journey-button").click();
//     cy.get("#journey-start-verify-button").click();

//     cy.contains("Journey has been started").should("exist");
//   });
// });
