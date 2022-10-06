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
      id: 'attributes',
      type: 'select',
      nextResourceURL: 'attributeConditions',
      options: [
        { label: 'firstName', id: 'firstName', nextResourceURL: 'firstName' },
        { label: 'lastName', id: 'lastName', nextResourceURL: 'lastName' },
        { label: 'email', id: 'email', nextResourceURL: 'email' },
      ],
    },
    {
      id: 'firstName',
      type: 'select',
      options: [
        { label: 'is equal to', id: 'isEqual', where: '' },
        { label: 'is not equal to', id: 'isNotEqual', where: '' },
        { label: 'exists', id: 'exists', where: '' },
        { label: 'does not exist', id: 'doesNotExist', where: '' },
        { label: 'contains', id: 'contains', where: '' },
        { label: 'does not contain', id: 'doesnotcontain', where: '' },
      ],
    },
    {
      id: 'lastName',
      type: 'select',
      options: [
        { label: 'is equal to', id: 'isEqual', where: '' },
        { label: 'is not equal to', id: 'isNotEqual', where: '' },
        { label: 'is greater than', id: 'isGreaterThan', where: '' },
        { label: 'is less than', id: 'isLessThan', where: '' },
        { label: 'exists', id: 'exists', where: '' },
        { label: 'does not exist', id: 'doesnotExist', where: '' },
      ],
    },
    {
      id: 'email',
      type: 'select',
      options: [
        { label: 'is equal to', id: 'isEqual', where: '' },
        { label: 'is not equal to', id: 'isNotEqual', where: '' },
        { label: 'exists', id: 'exists', where: '' },
        { label: 'does not exist', id: 'doesNotExist', where: '' },
        { label: 'contains', id: 'contains', where: '' },
        { label: 'does not contain', id: 'doesnotcontain', where: '' },
      ],
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
      id: 'isatimestampafter',
      type: 'dateTime',
    },
    {
      id: 'isatimestampbefore',
      type: 'dateTime',
    },
    {
      id: 'isatimestampbetween',
      type: 'dateRange',
    },
  ],
};
