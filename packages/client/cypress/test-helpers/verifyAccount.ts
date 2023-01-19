export default () => {
  cy.get('[data-disclosure-link="Settings"] > .bg-cyan-700').click();
  cy.get(".text-black").click();
  cy.get(".-mb-px > :nth-child(3)").click();
  cy.wait(1000);
  cy.contains("Free3").click();
  cy.contains("You need to verify your email!").should("exist");
  cy.request(`${Cypress.env("AxiosURL")}tests/test-verification`).then(
    ({ body }) => {
      expect(body.accountId).to.equal("-1000");
      expect(body.status).to.equal("sent");

      cy.request({
        url: `${Cypress.env("AxiosURL")}tests/verify-test-account/${body.id}`,
        method: "PATCH",
      });
      cy.wait(1000);
    }
  );
};
