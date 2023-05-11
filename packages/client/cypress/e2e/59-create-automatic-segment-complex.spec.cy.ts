/* eslint-disable jest/expect-expect */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/valid-describe-callback */
/* eslint-disable @typescript-eslint/no-shadow */

import credentials from "../fixtures/credentials";
import { createAutomaticComplexSegment } from "../test-helpers/createAutomaticComplexSegment";
import { loginFunc } from "../test-helpers/loginFunc";

const { email, password } = credentials.MessageHitUser;

describe(
  "Create automatic segment with complex logic",
  { env: { AxiosURL: "http://localhost:3001/" } },
  () => {
    beforeEach(() => {
      cy.request(`${Cypress.env("TESTS_API_BASE_URL")}tests/reset-tests`);
      cy.wait(1000);
    });

    it("passes", () => {
      loginFunc(email, password);
      createAutomaticComplexSegment();
    });
  }
);
