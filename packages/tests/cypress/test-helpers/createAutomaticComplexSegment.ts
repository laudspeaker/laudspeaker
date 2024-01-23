import credentials from "../fixtures/credentials";
const { segments } = credentials;

export const createAutomaticComplexSegment = () => {
  cy.get('[data-disclosure="Audience"]').click();
  cy.get('[data-disclosure-link="Segments"]').click();
  cy.get("#createTemplate").click();
  cy.get("#name").type(segments.automatic.name);
  cy.get("#description").type(segments.automatic.description);
  cy.get("#submitTemplateCreation").click();

  cy.contains("select").click();

  // email contains @
  cy.get("#data-option-attributes > :nth-child(1) > div").click();
  cy.get("#event-conditions > :nth-child(2)").click();
  cy.get("#data-option-email").click();
  cy.get("#event-conditions > :nth-child(3)").click();
  cy.get("#data-option-contains > :nth-child(1) > div").click();
  cy.get("#contains").type("@");
  cy.wait(1000);

  // slack admin true
  cy.contains("select").click();
  cy.get("#data-option-attributes > :nth-child(1) > div").click();
  cy.get("#event-conditions > :nth-child(2)").last().click();
  cy.get("#data-option-slackAdmin > :nth-child(1) > div").click();
  cy.wait(200);
  cy.get("#event-conditions > :nth-child(3)").last().click();
  cy.get("#data-option-isBoolEqual > :nth-child(1) > div").click();
  cy.get("#event-conditions > :nth-child(4)").last().click();
  cy.get("#data-option-true > :nth-child(1) > div").click();
  cy.wait(1000);

  // phone exist
  cy.contains("select").click();
  cy.get("#data-option-attributes > :nth-child(1) > div").click();
  cy.get("#event-conditions > :nth-child(2)").last().click();
  cy.get("#data-option-phone > :nth-child(1) > div").click();
  cy.wait(200);
  cy.get("#event-conditions > :nth-child(3)").last().click();
  cy.get("#data-option-exists > :nth-child(1) > div").click();
  cy.wait(1000);

  // slackId not equal to U00000
  cy.contains("select").click();
  cy.get("#data-option-attributes > :nth-child(1) > div").click();
  cy.wait(200);
  cy.get("#event-conditions > :nth-child(2)").last().click();
  cy.get("#data-option-slackId > :nth-child(1) > div").click();
  cy.wait(200);
  cy.get("#event-conditions > :nth-child(3)").last().click();
  cy.get("#data-option-isNotEqual > :nth-child(1) > div").click();
  cy.get("#isNotEqual").type("U00000");

  // save
  cy.get("#saveSegmentParams").click();
  cy.wait(1000);

  cy.location("pathname").then((data) => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("AxiosURL")}tests/get-segment-size/${
        data.split("/")[data.split("/").length - 1]
      }`,
    }).then(({ body }) => {
      expect(Number(body)).greaterThan(0);
    });
  });
};
