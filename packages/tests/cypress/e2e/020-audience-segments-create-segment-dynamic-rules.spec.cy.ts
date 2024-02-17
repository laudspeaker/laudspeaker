import credentials from "../fixtures/credentials";
import { loginFunc } from "../test-helpers/loginFunc";

const { email, password, firstName, lastName } = credentials;

describe("charawi", () => {
    it("tests charawi", () => {
      //AND
      //String contains "Charawi" ==> 1 Person
      cy.visit("/");
      cy.wait(2000);
      loginFunc(email, password);
      cy.wait(2000);
      cy.visit("/segment");
      cy.get('[id*="headlessui-popover-button-"] > button').click();
      cy.get("div:nth-of-type(2) > div.relative div:nth-of-type(2)").click();
      cy.get("#segmentName").click();
      cy.get("#segmentName").type("Charawi");
      cy.wait(500);
      cy.get("select").select('All');
      //cy.get("select").click();
      //cy.get("select").type("all");
      //cy.get("select").click();
      //cy.get('div.bg-\[\\#F3F4F6\] select').click();
      //cy.get('div.bg-\[\\#F3F4F6\] select').type("all");
      //cy.get("select").click();
      /*
      cy.get("select").type("all");
      cy.get("div.h-\\[calc\\(100\\%-46px\\)\\] div:nth-of-type(1) > div > div > div.w-full button.bg-white").click();
      // Click on the input
      cy.get('[id*="headlessui-combobox-input-"]').click();
      // Type "n" into the input
      cy.get('[id*="headlessui-combobox-input-"]').type("name");
      // Click on the option
      cy.get('[id*="headlessui-combobox-option-"]').click();
      */
      /*  
      
      cy.get("#segmentName").type("char2");
      
      
      cy.get("#headlessui-combobox-input-\\:r1ug\\:").click();
      cy.get("#headlessui-combobox-input-\\:r1ug\\:").type("n");
      cy.get("#headlessui-combobox-option-\\:r1v5\\:").click();
      cy.get("div:nth-of-type(4) > input").click();
      cy.get("div:nth-of-type(4) > input").type("C");
      cy.get("div:nth-of-type(4) > input").type("Charawi");
      cy.get("div.px-5 > div > div:nth-of-type(1) > div > div > div.w-full").click();
      cy.get("div.mt-\\[30px\\] > button").click();
      */
    });
  });
  