export default {
  conditions: {
    id: 'conditions',
    type: 'select',
    options: [
      { label: 'Add Condition Or Group', id: -1, isPlaceholder: true },
      { label: 'Events', id: 'events' },
      { label: 'Attributes', id: 'attributes' },
    ],
  },
  resources: [
    {
      id: 'events',
      type: 'inputText',
    },
    {
      id: 'eventBranches',
      type: 'select',
      options: [
        { label: 'Has Been Performed', id: 'eventPerformed' },
        { label: 'Has not been performed', id: 'eventNotPerformed' },
      ],
    },
    {
      id: 'eventPerformed',
      isNewRow: true,
      children: [
        {
          id: 'times',
          label: 'at least',
          type: 'inputNumber',
          range: {
            min: 1,
            max: 20,
          },
        },
        {
          id: 'frequency',
          label: 'time',
          type: 'select',
          options: [
            { label: 'ever', id: 'frequencyEver' },
            { label: 'atleast', id: 'frequencyAtleast' },
          ],
        },
      ],
    },
    {
      id: 'isEqual',
      type: 'inputText',
    },
    {
      id: 'isGreaterThan',
      type: 'inputNumber',
    },
    {
      id: 'isLessThan',
      type: 'inputNumber',
    },
    {
      id: 'isNotEqual',
      type: 'inputText',
    },
    {
      id: 'contains',
      type: 'inputText',
    },
    {
      id: 'doesNotContain',
      type: 'inputText',
    },
    {
      id: 'isTimestampAfter',
      type: 'dateTime',
    },
    {
      id: 'isTimestampBefore',
      type: 'dateTime',
    },
    {
      id: 'isatimestampbetween',
      type: 'dateRange',
    },
    {
      id: 'isBoolEqual',
      options: [
        { label: 'true', id: 'true' },
        { label: 'false', id: 'false' },
      ],
      type: 'select',
    },
    {
      id: 'isBoolNotEqual',
      options: [
        { label: 'true', id: 'true' },
        { label: 'false', id: 'false' },
      ],
      type: 'select',
    },
  ],
};
