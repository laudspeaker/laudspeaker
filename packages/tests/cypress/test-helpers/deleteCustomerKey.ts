/**
 * Creates a new customer attribute in the Audience settings.
 * @param attribute The name of the attribute to create
 * @param attribute_type The type of the attribute (default: "String")
 * @param attribute_subtype The subtype of the attribute (default: "String")
 * @param attribute_format The format of the attribute (default: "")
 */
export const deleteCustomerKey = (
    attribute: string,
    attribute_type: string = "String",
    attribute_subtype: string = "String",
    attribute_format: string = ""
  ) => {
    // Navigate to the Audience settings
    cy.contains("Audience").click();
    cy.contains("People").click();
    cy.get(':contains("Settings"):last').click();

    // Add a new attribute
    cy.contains("Add attribute").click();
    cy.get("input").clear().type(attribute);
  
    // Select the attribute type
    cy.contains(attribute_type).click();
    cy.get(`[data-option="${attribute_type}"]`).click();
  
    // Save the new attribute
    cy.contains("Save").click();
  
    // Wait for the save operation to complete
    cy.wait(1000);
  
    // Verify that the attribute was successfully created
    cy.contains("Attribute settings updated!").should("exist");
  
    // Additional wait to ensure the UI is ready for the next action
    cy.wait(1000);
  
    // Note: attribute_subtype and attribute_format parameters are currently unused
  };
  
  