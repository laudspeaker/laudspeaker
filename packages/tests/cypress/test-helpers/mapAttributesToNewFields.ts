const attributesDetails: { name: string; type: string; isPk?: boolean }[] = [
  { name: "name", type: "String" },
  { name: "email", type: "Email" },
  { name: "source", type: "String" },
  { name: "user_id", type: "Number", isPk: true },
  { name: "is_delete", type: "Boolean" },
  { name: "is_own_car", type: "Boolean" },
  { name: "income_type", type: "String" },
  { name: "credit_score", type: "Number" },
  { name: "bill_org_name", type: "String" },
  { name: "revolving_amt", type: "Number" },
  { name: "recent_3m_appl", type: "Number" },
  { name: "recent_appl_date", type: "Date" },
  { name: "recent_repay_amt", type: "Number" },
  { name: "credit_score_date", type: "Date" },
  { name: "recent_repay_count", type: "Number" },
  { name: "yesterday_diff_credit_score", type: "Number" },
];

export const mapAttributesToNewFields = (attributes = attributesDetails) => {
  const PK = attributes.find((attribute) => attribute.isPk)!;
  attributes.forEach((attribute) => {
    cy.get(`#select-${attribute.name}`).click({ force: true });
    cy.get("#addNewField").click();
    cy.get("#fieldNameInput").type(attribute.name);
    cy.get("#selectTypeInput").type(attribute.name);
    cy.get(`[data-option="${attribute.type}"]`).click({ force: true });
    if (attribute.type === "Date") {
      cy.get("#dateFormatPicker").click();
      cy.get('[data-option="yyyy-MM-dd"]').click({ force: true });
    }
    if (attribute.type === "DateTime") {
      cy.get("#dateFormatPicker").click();
      cy.get(`[data-option="yyyy-MM-dd'T'HH:mm"]`).click({ force: true });
    }
    cy.get("#saveAddAttributeModalButton").click();
  });

  cy.get(`[data-testid='${PK.name}-primary-key-option']`).scrollIntoView();
  cy.get(`[data-testid='${PK.name}-primary-key-option']`).click({
    force: true,
  });
  cy.wait(1000);
};
