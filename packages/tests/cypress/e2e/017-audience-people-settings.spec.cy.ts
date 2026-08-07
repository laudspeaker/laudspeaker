import credentials from "../fixtures/credentials";
import { createCustomerKey } from "../test-helpers/createCustomerKey";
import { setPrimaryKey } from "../test-helpers/setPrimaryKey";
import { setupOrganization } from "../test-helpers/setupOrganization";
import signup from "../test-helpers/signup";
import { deleteCustomerKey } from "../test-helpers/deleteCustomerKey";

const { email, password, firstName, lastName, organizationName, timeZone } = credentials;

describe("Audience->People Settings", () => {
  before(() => {
    cy.request(`${Cypress.env("TESTS_API_BASE_URL")}/tests/reset-tests`);
    cy.wait(1000);
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    signup(email, password, firstName, lastName);
    cy.wait(1000);
    setupOrganization(organizationName, timeZone);
    cy.wait(5000);
  });

  beforeEach(() => {
    cy.session([email, password], () => {
      cy.visit('/login');
      cy.get('#email').type(email);
      cy.get('#password').type(password);
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/login');
    });

    cy.visit('/');
  });

  describe("Defining customer attributes", () => {
    describe("Attribute name validation", () => {

      it("allows you to create an attribute with a valid name", () => {
        createCustomerKey("valid_attribute_name", "String");
      });

      it("allows you to create an attribute with numbers in the name", () => {
        createCustomerKey("valid2name3with4numbers", "String");
      });

      it("does not allow you to save an empty attribute name", () => {
        createCustomerKey("", "String", "", "", "Attribute key must be defined!");
      });

      it("does not allow you to save an attribute with a duplicate name", () => {
        createCustomerKey("unique_attribute", "String");
        createCustomerKey("unique_attribute", "String", "", "", "Attribute duplication is not allowed!");
      });

      it("does not allow you to save an attribute with invalid characters", () => {
        createCustomerKey("a.dot_attribute", "String", "", "", "Invalid key name; keys must adhere to JSON key naming rules. See here for more information.");
        createCustomerKey("a-dash_attribute", "String", "", "", "Invalid key name; keys must adhere to JSON key naming rules. See here for more information.");
        createCustomerKey("a space_attribute", "String", "", "", "Invalid key name; keys must adhere to JSON key naming rules. See here for more information.");
        // expect(() => createCustomerKey("$dollar_attribute", "String")).to.throw();
        // expect(() => createCustomerKey("special!@#$%^&*()_+,./<>?;:[]{}|\\", "String")).to.throw();
      });

      // it("does not allow you to save an attribute with a name longer than the maximum allowed length", () => {
      //   const longName = "a".repeat(256); // Assuming 255 is the max length
      //   expect(() => createCustomerKey(longName, "String")).to.throw();
      // });

      // it("does not allow you to save an attribute with only numbers in the name", () => {
      //   expect(() => createCustomerKey("123456", "String")).to.throw();
      // });

      // it("does not allow you to create an attribute with a name that starts with a number", () => {
      //   expect(() => createCustomerKey("1invalid_name", "String")).to.throw();
      // });

      // it("does not allow you to create an attribute with a reserved keyword as the name", () => {
      //   expect(() => createCustomerKey("id", "String")).to.throw();
      //   expect(() => createCustomerKey("created_at", "Date")).to.throw();
      //   expect(() => createCustomerKey("updated_at", "Date")).to.throw();
      // });

    });

    // describe("Attribute type validation", () => {
    //   const validTypes = ["String", "Number", "Date", "Boolean", "Email", "Phone", "Array", "Object"];
    //   validTypes.forEach(type => {
    //     it(`allows you to create a customer attribute of type ${type}`, () => {
    //       createCustomerKey(`a_${type.toLowerCase()}_attribute`, type);
    //     });
    //   });

    //   it("does not allow you to create an attribute with an invalid type", () => {
    //     expect(() => createCustomerKey("invalid_type_attribute", "InvalidType")).to.throw();
    //   });
    // });

    // describe("Setting primary key", () => {
    //   const validPrimaryKeyTypes = ["String", "Number", "Email", "Phone"];
    //   validPrimaryKeyTypes.forEach(type => {
    //     it(`allows you to set a customer attribute of type ${type} as the primary key`, () => {
    //       const attributeName = `a_${type.toLowerCase()}_attribute`;
    //       createCustomerKey(attributeName, type);
    //       setPrimaryKey(attributeName);
    //     });
    //   });

      //   const invalidPrimaryKeyTypes = ["Array", "Object"];
      //   invalidPrimaryKeyTypes.forEach(type => {
      //     it(`does not allow you to set a customer attribute of type ${type} as the primary key`, () => {
      //       const attributeName = `a_${type.toLowerCase()}_attribute`;
      //       createCustomerKey(attributeName, type);
      //       expect(() => setPrimaryKey(attributeName)).to.throw();
      //     });
      //   });

      //   it("does not allow you to set a non-existent attribute as the primary key", () => {
      //     expect(() => setPrimaryKey("non_existent_attribute")).to.throw();
      //   });
    // });

    // describe("Deleting customer attributes", () => {
    //   it("allows you to delete an existing attribute", () => {
    //     const attributeName = "deletable_attribute";
    //     createCustomerKey(attributeName, "String");
    //     deleteCustomerKey(attributeName);
    //     // Verify the attribute no longer exists (implementation depends on your UI)
    //     cy.get('[data-testid="attribute-list"]').should('not.contain', attributeName);
    //   });

    //   it("does not allow you to delete the primary key attribute", () => {
    //     const primaryKeyName = "primary_key_attribute";
    //     createCustomerKey(primaryKeyName, "String");
    //     setPrimaryKey(primaryKeyName);
    //     expect(() => deleteCustomerKey(primaryKeyName)).to.throw();
    //   });

    //   it("does not allow you to delete a non-existent attribute", () => {
    //     expect(() => deleteCustomerKey("non_existent_attribute")).to.throw();
    //   });

    //   it("allows you to delete multiple attributes", () => {
    //     const attributes = ["attr1", "attr2", "attr3"];
    //     attributes.forEach(attr => createCustomerKey(attr, "String"));
    //     attributes.forEach(attr => deleteCustomerKey(attr));
    //     // Verify all attributes are removed
    //     cy.get('[data-testid="attribute-list"]').should('not.contain', attributes[0])
    //       .and('not.contain', attributes[1])
    //       .and('not.contain', attributes[2]);
    //   });

    //   it("updates the UI immediately after deleting an attribute", () => {
    //     const attributeName = "quick_delete_attr";
    //     createCustomerKey(attributeName, "String");
    //     deleteCustomerKey(attributeName);
    //     // Check that the attribute disappears from the UI without needing a page refresh
    //     cy.get('[data-testid="attribute-list"]').should('not.contain', attributeName);
    //   });

    //   //TODO: Check what happens to other parts of the system when an attribute is deleted,
    //   // e.g. if a user has been created with that attribute, what happens to that user?
    //   // e.g. if a journey segments based on that attribute, what happens to that journey, or the multisplit steps in that journey?
    //   // e.g. if a segment segments based on that attribute, what happens to that segment?
    // });

    // TODO: Implement these tests when the functionality is available
    // it("allows you to create a customer attribute of type url", () => {
    //   createCustomerKey("a_url_attribute", "URL");
    // });
    // it("allows you to create a customer attribute of type zip", () => {
    //   createCustomerKey("a_zip_attribute", "Zip");
    // });
  });
});
