import { format } from "date-fns";
import setDate from "./setDate";

export default () => {
  const now = new Date();
  const earlier = new Date(now.getTime() - 60000);
  const later = new Date(now.getTime() + 3600000);

  cy.get("#timeWindow > .p-0 > .justify-between").click();
  cy.get("#fromValueDate input").then((input) => {
    setDate(
      input[0],
      format(earlier, "yyyy-MM-dd") + "T" + format(earlier, "hh:mm")
    );
  });
  cy.wait(1000);
  cy.get("#toValueDate input").then((input) => {
    setDate(
      input[0],
      format(later, "yyyy-MM-dd") + "T" + format(later, "hh:mm")
    );
  });
  cy.wait(1000);
  cy.get("#save-trigger").click();
};
