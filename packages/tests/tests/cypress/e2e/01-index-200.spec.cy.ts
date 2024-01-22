describe("Initial testing", () => {
  it("failes loading index", () => {
    cy.request("/api/accounts").then((resp) => expect(resp.status).to.eq(200));
  });
  it("successfully loads index", () => {
    cy.visit("/");
  });
});
