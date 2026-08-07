/**
 * Creates a new customer attribute in the Audience settings.
 * @param attribute The name of the attribute to create
 * @param attribute_type The type of the attribute (default: "String")
 * @param attribute_subtype The subtype of the attribute (default: "String")
 * @param attribute_format The format of the attribute (default: "")
 * @param expectedError Optional error message to check for
 */

export const createCustomerKey = (
  attribute: string,
  attribute_type: string = "String",
  attribute_subtype: string = "",
  attribute_format: string = "",
  expectedError?: string
) => {
  // Navigate to the home page
  cy.visit('/');

  // Navigate to the Audience settings
  cy.contains("Audience").click();
  cy.contains("People").click();
  cy.get(':contains("Settings"):last').click();

  cy.contains("Add attribute").click();
  
  cy.get('.flex.flex-col.gap-2\\.5 > div').last().within(() => {
    if (attribute) {
      cy.get('input').first().clear().type(attribute);
    }

    cy.get('button').eq(0).click();
    cy.get(`[data-option="${attribute_type}"]`).click();

    // If there's a subtype, select it
    if (attribute_subtype) {
      cy.get('button').eq(1).click();
      cy.get(`[data-option="${attribute_subtype}"]`).click();
    }

    // If there's a date format, select it
    if (attribute_format) {
      cy.get('button').eq(2).click();
      cy.get(`[data-option="${attribute_format}"]`).click();
    }
  });

  // Check for expected error or success
  if (expectedError) {
    // If an error is expected, check for its presence
    cy.contains(expectedError).should('exist');
    // Ensure the Save button is disabled
    cy.contains('Save').should('be.disabled');
  } else {
    // If no error is expected, check that no error messages exist
    cy.get('.text-red-500').should('not.exist');
    // Save the new attribute
    cy.contains("Save").click();
    // Verify that the attribute was successfully created
    cy.contains("Attributes successfully modified!").should("exist");
  }
};