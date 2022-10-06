import { CustomerDocument } from '../customers/schemas/customer.schema';

const conditionalCompare = (custAttr: any, checkVal: any, operator: string) => {
  switch (operator) {
    case 'isEqual':
      return custAttr == checkVal;
    case 'isNotEqual':
      return custAttr != checkVal;
    case 'contains':
      return custAttr.includes(checkVal);
    case 'doesNotContain':
      return !custAttr.includes(checkVal);
    case 'isBoolEqual':
      return custAttr === (checkVal === 'true');
    case 'isBoolNotEqual':
      return custAttr !== (checkVal === 'true');
    case 'isTimestampBefore':
      return new Date(custAttr) < new Date(checkVal);
    case 'isTimestampAfter':
      return new Date(custAttr) > new Date(checkVal);
    case 'isGreaterThan':
      return custAttr > Number(checkVal);
    case 'isLessThan':
      return custAttr < Number(checkVal);
  }
};

const operableCompare = (custAttr: any, operator: string) => {
  switch (operator) {
    case 'exists':
      return custAttr != null && custAttr != undefined;
    case 'doesNotExist':
      return custAttr == null || custAttr == undefined;
  }
};

export const checkInclusion = (
  cust: CustomerDocument,
  inclusionCriteria: any
) => {
  if (
    !inclusionCriteria ||
    !inclusionCriteria.conditions ||
    !inclusionCriteria.conditions.length
  )
    return true;
  switch (inclusionCriteria.conditionalType) {
    case 'and':
      for (
        let index = 0;
        index < inclusionCriteria.conditions.length;
        index++
      ) {
        const custAttr = cust[inclusionCriteria.conditions[index].attribute];
        if (inclusionCriteria.conditions[index].condition) {
          if (
            !conditionalCompare(
              custAttr,
              inclusionCriteria.conditions[index].value,
              inclusionCriteria.conditions[index].condition
            )
          ) {
            return false;
          }
        } else {
          if (
            !operableCompare(
              custAttr,
              inclusionCriteria.conditions[index].value
            )
          )
            return false;
        }
      }
      return true;
    case 'or':
      // eslint-disable-next-line no-case-declarations
      let found = false;
      for (
        let index = 0;
        index < inclusionCriteria.conditions.length;
        index++
      ) {
        const custAttr = cust[inclusionCriteria.conditions[index].attribute];
        if (inclusionCriteria.conditions[index].condition) {
          if (
            conditionalCompare(
              custAttr,
              inclusionCriteria.conditions[index].value,
              inclusionCriteria.conditions[index].condition
            )
          ) {
            found = true;
          }
        } else {
          if (
            operableCompare(custAttr, inclusionCriteria.conditions[index].value)
          )
            found = true;
        }
      }
      return found;
  }
};
