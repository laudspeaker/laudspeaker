import { loginFunc } from "../test-helpers/loginFunc";
import { templatesFunc } from "../test-helpers/templatesFunc";

describe("templates", () => {
  it("passes", () => {
    loginFunc();
    templatesFunc();
  });
});
