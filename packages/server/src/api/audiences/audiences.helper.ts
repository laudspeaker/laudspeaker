import { CustomerDocument } from '../customers/schemas/customer.schema';

export const conditionalCompare = (
  custAttr: any,
  checkVal: any,
  operator: string
) => {
  switch (operator) {
    case 'isEqual':
      return custAttr == checkVal;
    case 'isNotEqual':
      return custAttr != checkVal;
    case 'contains':
      return (custAttr as any[])?.includes(checkVal) || false;
    case 'doesNotContain':
      return (custAttr && !(custAttr as any[]).includes(checkVal)) || false;
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
    default:
      return false;
  }
};

export const operableCompare = (custAttr: any, operator: string) => {
  switch (operator) {
    case 'exists':
      return custAttr != null && custAttr != undefined;
    case 'doesNotExist':
      return custAttr == null || custAttr == undefined;
  }
};

export const conditionalComposition = (
  conditions: boolean[],
  types: ('and' | 'or')[]
) => {
  if (conditions.length === 0) return true;
  if (conditions.length === 1) return conditions[0];

  if (!types.includes('or'))
    return conditions.reduce((acc, condition) => acc && condition);

  if (!types.includes('and'))
    return conditions.reduce((acc, condition) => acc || condition);

  const orPosition = types.indexOf('or');

  const part1Conditions = conditions.slice(0, orPosition);
  const part2Conditions = conditions.slice(orPosition + 1);

  const part1Types = types.slice(0, orPosition);
  const part2Types = types.slice(orPosition + 1);

  const res1 = conditionalComposition(part1Conditions, part1Types);
  const res2 = conditionalComposition(part2Conditions, part2Types);

  return res1 || res2;
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
