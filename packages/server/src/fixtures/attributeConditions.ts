export const attributeConditions = (type: string, isArray: boolean): any[] => {
  if (isArray) {
    return [
      { label: 'contains', id: 'contains', where: '' },
      { label: 'does not contain', id: 'doesNotContain', where: '' },
    ];
  }
  switch (type) {
    case 'String':
      return [
        { label: 'is equal to', id: 'isEqual', where: '' },
        { label: 'is not equal to', id: 'isNotEqual', where: '' },
        { label: 'exists', id: 'exists', where: '' },
        { label: 'does not exist', id: 'doesNotExist', where: '' },
        { label: 'contains', id: 'contains', where: '' },
        { label: 'does not contain', id: 'doesNotContain', where: '' },
      ];
    case 'Email':
      return [
        { label: 'is equal to', id: 'isEqual', where: '' },
        { label: 'is not equal to', id: 'isNotEqual', where: '' },
        { label: 'exists', id: 'exists', where: '' },
        { label: 'does not exist', id: 'doesNotExist', where: '' },
        { label: 'contains', id: 'contains', where: '' },
        { label: 'does not contain', id: 'doesNotContain', where: '' },
      ];
    case 'Number':
      return [
        { label: 'is equal to', id: 'isEqual', where: '' },
        { label: 'is not equal to', id: 'isNotEqual', where: '' },
        { label: 'is greater than', id: 'isGreaterThan', where: '' },
        { label: 'is less than', id: 'isLessThan', where: '' },
        { label: 'exists', id: 'exists', where: '' },
        { label: 'does not exist', id: 'doesNotExist', where: '' },
      ];
    case 'Boolean':
      return [
        { label: 'is equal to', id: 'isBoolEqual', where: '' },
        { label: 'is not equal to', id: 'isBoolNotEqual', where: '' },
      ];
    case 'Date':
      return [
        {
          label: 'before',
          id: 'isTimestampBefore',
          where: '',
        },
        { label: 'after', id: 'isTimestampAfter', where: '' },
      ];
  }
};
