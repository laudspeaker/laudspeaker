import credentials from "../fixtures/credentials.json";

const { email, password } = credentials;

describe("Journey with email triggered", () => {
  it("passes", () => {
    cy.visit("/");
    cy.clearCookies();
    cy.clearCookies();
    cy.url().should("include", "/login");
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.get(".css-0 > .MuiGrid-root > .MuiButton-root").click();
    cy.url().should("include", "/dashboard");
    cy.reload();
    cy.url().should("include", "/dashboard");

    cy.get(
      '[href="/flow"] > .MuiListItem-root > .MuiListItemButton-root'
    ).click();
    cy.url().should("include", "/flow");
    cy.get(".MuiButton-root").click();
    cy.get("#name").type("test1");
    cy.get(".MuiPaper-root > .MuiBox-root > .MuiButton-root").click();
    cy.url().should("include", "/flow/test1");
    cy.get(
      ":nth-child(3) > .MuiListItem-root > .MuiListItemButton-root"
    ).click();
    cy.get("#name").type("First");
    cy.get("#description").type("first");
    cy.get(".css-1bvc4cc > .MuiButton-root").click();
    cy.get(".text-updater").move({ deltaX: 100, deltaY: 100 });
    cy.get(
      ":nth-child(3) > .MuiListItem-root > .MuiListItemButton-root"
    ).click();
    cy.get("#name").type("Second");
    cy.get("#description").type("second");
    cy.get(".MuiPaper-root > .MuiBox-root > .MuiButton-root").click();
    cy.get("div:not(.selected) > .text-updater-node > .text-updater").move({
      deltaX: 100,
      deltaY: 300,
    });
    cy.get("div:not(.selected) > .text-updater-node > .text-updater").click();
    cy.get(
      ":nth-child(6) > .MuiListItem-root > .MuiListItemButton-root"
    ).click();
    cy.get("#mui-component-select-conditions").click();
    cy.get('.MuiList-root > [tabindex="0"]').click();
    cy.get("#events").type("event123");
    cy.get(".css-120hbbo > :nth-child(2) > .MuiButton-root").click();
    cy.get(
      '[style="display: flex; height: 15px; position: absolute; left: 0px; bottom: 0px; align-items: center; width: 100%; justify-content: space-around;"] > .react-flow__handle'
    ).drag("div:not(.selected) > .text-updater-node > .react-flow__handle");
    cy.get(
      "div:not(.selected) > .text-updater-node > .react-flow__handle"
    ).click();
    cy.get("div:not(.selected) > .text-updater-node > .text-updater").click();
    cy.get(
      ".css-wgtxfr > .MuiDrawer-root > .MuiPaper-root > :nth-child(1) > .MuiList-root > :nth-child(10) > .MuiListItem-root > .MuiListItemButton-root"
    ).click();
    cy.get("#activeJourney").click();
    cy.contains("With email");
    cy.get(".MuiMenuItem-root").click();
    cy.get(":nth-child(4) > .MuiButton-root").click();
    cy.get(":nth-child(1) > .MuiButton-root").click();
    cy.wait(100);
    cy.get(":nth-child(2) > .MuiButton-root").click();
  });
});
