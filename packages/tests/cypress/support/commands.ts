import "@4tw/cypress-drag-drop";
/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
declare global {
  namespace Cypress {
    interface Chainable {
      uploadCSV: (args: any) => void;
    }
  }
}

Cypress.Commands.add("uploadCSV", (args) => {
  const user = JSON.parse(localStorage.getItem("userData") || "{}");

  cy.request({
    method: "POST",
    url: `${Cypress.env("TESTS_API_BASE_URL")}/tests/seed-test-audience`,
    headers: {
      Authorization: `Bearer ${user.accessToken}`,
    },
  }).then((response) => {
    expect(response.status).to.eq(201);
  });

  const fileName = "Correctness.csv";

  cy.fixture(fileName, "utf-8")
    .then(Cypress.Blob.binaryStringToBlob)
    .then((blob) => {
      const file = new File([blob], fileName, { type: "text/csv" });

      const formdata = new FormData();
      formdata.append("file", file, "Correctness.csv");

      cy.request({
        method: "POST",
        url: `${Cypress.env("TESTS_API_BASE_URL")}/customers/uploadCSV`,
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "content-type": "multipart/form-data",
        },
        body: formdata,
      }).then((response) => {
        expect(response.status).to.eq(201);
      });

      const importData: Record<string, unknown> = {
        mapping: {
          name: {
            head: "name",
            isPrimary: false,
            doNotOverwrite: false,
            asAttribute: {
              key: "name",
              type: "String",
              // dateFormat: "undefined",
              skip: false,
            },
          },
          email: {
            head: "email",
            asAttribute: {
              key: "email",
              type: "Email",
              skip: false,
            },
            isPrimary: true,
            doNotOverwrite: false,
          },
          source: {
            head: "source",
            isPrimary: false,
            doNotOverwrite: false,
          },
          user_id: {
            head: "user_id",
            asAttribute: {
              key: "user_id",
              type: "String",
              dateFormat: "undefined",
              skip: false,
            },
            isPrimary: false,
            doNotOverwrite: false,
          },
          is_delete: {
            head: "is_delete",
            isPrimary: false,
            doNotOverwrite: false,
            asAttribute: {
              key: "is_delete",
              type: "Boolean",
              // dateFormat: "undefined",
              skip: false,
            },
          },
          is_own_car: {
            head: "is_own_car",
            asAttribute: {
              key: "is_own_car",
              type: "Boolean",
              dateFormat: "undefined",
              skip: false,
            },
            isPrimary: false,
            doNotOverwrite: false,
          },
          income_type: {
            head: "income_type",
            isPrimary: false,
            doNotOverwrite: false,
          },
          credit_score: {
            head: "credit_score",
            isPrimary: false,
            doNotOverwrite: false,
            asAttribute: {
              key: "credit_score",
              type: "Number",
              dateFormat: "undefined",
              skip: false,
            },
          },
          bill_org_name: {
            head: "bill_org_name",
            isPrimary: false,
            doNotOverwrite: false,
          },
          revolving_amt: {
            head: "revolving_amt",
            isPrimary: false,
            doNotOverwrite: false,
          },
          chocolate_pref: {
            head: "chocolate_pref",
            isPrimary: false,
            doNotOverwrite: false,
          },
          recent_3m_appl: {
            head: "recent_3m_appl",
            isPrimary: false,
            doNotOverwrite: false,
          },
          recent_appl_date: {
            head: "recent_appl_date",
            isPrimary: false,
            doNotOverwrite: false,
            asAttribute: {
              key: "recent_appl_date",
              type: "Date",
              dateFormat: "yyyy-MM-dd",
              skip: false,
            },
          },
          recent_repay_amt: {
            head: "recent_repay_amt",
            isPrimary: false,
            doNotOverwrite: false,
            asAttribute: {
              key: "recent_repay_amt",
              type: "Number",
              skip: false,
            },
          },
          credit_score_date: {
            head: "credit_score_date",
            isPrimary: false,
            doNotOverwrite: false,
          },
          recent_repay_count: {
            head: "recent_repay_count",
            isPrimary: false,
            doNotOverwrite: false,
          },
          member_register_time: {
            head: "member_register_time",
            isPrimary: false,
            doNotOverwrite: false,
          },
          prev_savings_exp_date: {
            head: "prev_savings_exp_date",
            isPrimary: false,
            doNotOverwrite: false,
          },
          yesterday_diff_credit_score: {
            head: "yesterday_diff_credit_score",
            isPrimary: false,
            doNotOverwrite: false,
          },
          androidDeviceToken: {
            head: "androidDeviceToken",
            isPrimary: false,
            doNotOverwrite: false,
            asAttribute: {
              key: "androidDeviceToken",
              type: "String",
              dateFormat: "undefined",
              skip: false,
            },
          },
          iosDeviceToken: {
            head: "iosDeviceToken",
            isPrimary: false,
            doNotOverwrite: false,
            asAttribute: {
              key: "iosDeviceToken",
              type: "String",
              dateFormat: "undefined",
              skip: false,
            },
          },
        },
        importOption: "NEW",
      };

      cy.request({
        url: `${Cypress.env("TESTS_API_BASE_URL")}/customers/getLastImportCSV`,
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      }).then((response) => {
        const body = response.body;
        expect(body).to.have.property("fileKey");
        importData.fileKey = body.fileKey;
        expect(response.status).to.eq(200);
      });

      cy.request({
        method: "POST",
        url: `${Cypress.env(
          "TESTS_API_BASE_URL"
        )}/customers/attributes/start-import`,
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: importData,
      }).then((response) => {
        expect(response.status).to.eq(201);
      });
    });
});
