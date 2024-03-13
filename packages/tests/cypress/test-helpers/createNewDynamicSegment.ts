interface SegmentCondition {
  attributeName: string;
  type: string;
  operator: string;
  value: string;
  index?: number;
}

export const addSegmentCondition = ({
  attributeName,
  type,
  operator,
  value,
  index = 0,
}: SegmentCondition) => {
  cy.get("[data-testid='filter-builder-add-condition-button']").click();
  cy.get(`[data-testid='attribute-name-input-${index}']`).clear();
  cy.get(`[data-testid='attribute-name-input-${index}']`).type(attributeName);
  if (type === "string") {
    addStringCondition(operator, value, index);
  } else if (type === "number") {
    addNumericCondition(operator, value, index);
  } else if (type === "boolean") {
    addBooleanCondition(operator, value);
  } else if (type === "date") {
    addDateCondition(operator, value);
  } else if (type === "email") {
    addEmailCondition(operator, value, index);
  }
};

// Helper function to perform common actions for string comparisons
const addStringCondition = (
  comparisonType: string,
  value: string,
  index = 0
) => {
  cy.get(`[data-testid='attribute-statement-select-${index}']`).select(
    `String;;${comparisonType}`
  );

  cy.get(`[data-testid='attribute-statement-${index}']`).clear();
  cy.get(`[data-testid='attribute-statement-${index}']`).type(value);
};

// Helper function to perform common actions for number comparisons
const addNumericCondition = (
  comparisonType: string,
  value: string,
  index = 0
) => {
  cy.get(`[data-testid='attribute-statement-select-${index}']`).select(
    `Number;;${comparisonType}`
  );
  cy.get(`[data-testid='attribute-statement-${index}']`).clear();
  cy.get(`[data-testid='attribute-statement-${index}']`).type(value);
};

// Helper function to perform common actions for boolean comparisons
const addBooleanCondition = (
  comparisonType: string,
  value: string,
  index = 0
) => {
  cy.get(`[data-testid='attribute-statement-select-${index}']`).select(
    `Boolean;;${comparisonType}`
  );

  cy.get(`[data-testid='attribute-statement-${index}-boolean-button']`).click();
  cy.get(
    `[data-testid='attribute-statement-${index}-boolean-option-${value}']`
  ).click();
};

const addEmailCondition = (
  comparisonType: string,
  value: string,
  index = 0
) => {
  cy.get(`[data-testid='attribute-statement-select-${index}']`).select(
    `Email;;${comparisonType}`
  );

  cy.get(`[data-testid='attribute-statement-${index}']`).clear();
  cy.get(`[data-testid='attribute-statement-${index}']`).type(value);
};

const addDateCondition = (comparisonType: string, value: string, index = 0) => {
  cy.get(`[data-testid='attribute-statement-select-${index}']`).select(
    `Date;;${comparisonType}`
  );
  cy.get("#date-comparison-type-select").click();

  const [date1, date2] = value.split(" to ");

  if (date1 && !date2) {
    // cy.get(`[data-testid='attribute-name-${index}-date-select-option-absolute date']`).click();
    cy.get(`[data-testid='attribute-statement-${index}']`).clear().type(date1);
  } else if (date1 && date2) {
    // cy.get(`[data-testid='attribute-name-${index}-date-select-option-relative date']`).click();
    cy.get(`[data-testid='attribute-statement-${index}']`)
      .eq(0)
      .clear()
      .type(date1);
    cy.get(`[data-testid='attribute-statement-${index}']`)
      .eq(1)
      .clear()
      .type(date2);
  }
};

interface DynamicSegment {
  name: string;
  conditions: SegmentCondition[];
  matchingUserId: number;
}

export const stringSegments: DynamicSegment[] = [
  {
    name: "SG_1",
    conditions: [
      {
        attributeName: "name",
        type: "string",
        operator: "is equal to",
        value: "Charawi",
      },
    ],
    matchingUserId: 913,
  },
  {
    name: "SG_2",
    conditions: [
      {
        attributeName: "bill_org_name",
        type: "string",
        operator: "is not equal to",
        value: "[]",
      },
    ],
    matchingUserId: 384,
  },
  {
    name: "SG_3",
    conditions: [
      {
        attributeName: "name",
        type: "string",
        operator: "contains",
        value: "Hwa",
      },
    ],
    matchingUserId: 903,
  },
  {
    name: "SG_4",
    conditions: [
      {
        attributeName: "income_type",
        type: "string",
        operator: "does not contain",
        value: "E",
      },
    ],
    matchingUserId: 678,
  },
];

export const numberSegments: DynamicSegment[] = [
  {
    name: "SG_5",
    conditions: [
      {
        attributeName: "credit_score",
        type: "number",
        operator: "is greater than",
        value: "849",
      },
    ],
    matchingUserId: 544,
  },
  {
    name: "SG_6",
    conditions: [
      {
        attributeName: "credit_score",
        type: "number",
        operator: "is equal to",
        value: "786",
      },
    ],
    matchingUserId: 462,
  },
  {
    name: "SG_7",
    conditions: [
      {
        attributeName: "yesterday_diff_credit_score",
        type: "number",
        operator: "is not equal to",
        value: "0",
      },
    ],
    matchingUserId: 403,
  },
  {
    name: "SG_8",
    conditions: [
      {
        attributeName: "credit_score",
        type: "number",
        operator: "is less than",
        value: "571",
      },
    ],
    matchingUserId: 194,
  },
];

export const booleanSegments: DynamicSegment[] = [
  {
    name: "SG_9",
    matchingUserId: 663,
    conditions: [
      {
        attributeName: "is_delete",
        type: "boolean",
        operator: "is equal to",
        value: "true",
      },
      {
        attributeName: "name",
        type: "string",
        operator: "is equal to",
        value: "Planck",
      },
    ],
  },
  {
    name: "SG_10",
    matchingUserId: 125,
    conditions: [
      {
        attributeName: "is_delete",
        type: "boolean",
        operator: "is not equal to",
        value: "true",
      },
      {
        attributeName: "name",
        type: "string",
        operator: "is equal to",
        value: "Hubble",
      },
    ],
  },
];

export const emailSegments: DynamicSegment[] = [
  {
    name: "SG_11",
    conditions: [
      {
        attributeName: "email",
        type: "email",
        operator: "is equal to",
        value: "testing+11@laudspeaker.com",
      },
    ],
    matchingUserId: 689,
  },
  {
    name: "SG_12",
    conditions: [
      {
        attributeName: "email",
        type: "email",
        operator: "contains",
        value: "19",
      },
    ],
    matchingUserId: 364,
  },
  {
    name: "SG_13",
    conditions: [
      {
        attributeName: "email",
        type: "email",
        operator: "does not contain",
        value: "testing",
      },
    ],
    matchingUserId: 596,
  },
];

export const dateSegments: DynamicSegment[] = [
  {
    name: "SG_14",
    conditions: [
      {
        attributeName: "recent_appl_date",
        type: "date",
        operator: "before",
        value: "2020-05-01",
      },
    ],
    matchingUserId: 405,
  },
  {
    name: "SG_15",
    conditions: [
      {
        attributeName: "recent_appl_date",
        type: "date",
        operator: "after",
        value: "2023-12-19",
      },
    ],
    matchingUserId: 251,
  },
  {
    name: "SG_16",
    conditions: [
      {
        attributeName: "recent_appl_date",
        type: "date",
        operator: "during",
        value: "2023-09-10 to 2023-09-12",
      },
    ],
    matchingUserId: 546,
  },
];

export const createNewDynamicSegment = ({
  name,
  conditions,
}: DynamicSegment) => {
  cy.visit("/segment");
  cy.get("#createSegmentSelect").click();
  cy.get('[data-option="automatic"]').click();
  cy.get("#segmentName").type(name);
  cy.get('[data-testid="filter-builder-condition-select"]').select("All");

  conditions.forEach((condition, index) => {
    addSegmentCondition({ ...condition, index });
  });

  cy.contains("users estimated reached ≈ 1", { timeout: 10000 }).should(
    "be.visible"
  );

  cy.get("#saveSegmentButton").click();
  cy.contains("Eligible users: 1 Users", { timeout: 10000 }).should(
    "be.visible"
  );
  cy.wait(2000);
};
