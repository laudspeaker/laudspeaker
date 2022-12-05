import { loginFunc } from "../test-helpers/loginFunc";
import { tamplatesFunc } from "../test-helpers/templatesFunc";

describe("templates", () => {
  it("passes", () => {
    loginFunc();
    tamplatesFunc();
  });
});
