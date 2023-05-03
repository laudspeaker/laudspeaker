import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common/decorators';
import { forwardRef } from '@nestjs/common/utils';
import { Account } from '../accounts/entities/accounts.entity';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { SegmentsService } from '../segments/segments.service';
import { InclusionCriteria } from '../segments/types/segment.type';

@Injectable()
export class AudiencesHelper {
  constructor(
    @Inject(forwardRef(() => SegmentsService))
    private segmentsService: SegmentsService
  ) {}

  public async conditionalCompare(
    custAttr: any,
    checkVal: any,
    operator: string,
    segmentData?: { account?: Account }
  ) {
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
      case 'memberof':
        if (!segmentData?.account) return false;

        return this.segmentsService.isCustomerMemberOf(
          segmentData.account,
          checkVal,
          custAttr
        );
      default:
        return false;
    }
  }

  public operableCompare(custAttr: any, operator: string) {
    switch (operator) {
      case 'exists':
        return custAttr != null && custAttr != undefined;
      case 'doesNotExist':
        return custAttr == null || custAttr == undefined;
    }
  }

  public conditionalComposition(
    conditions: boolean[],
    types: ('and' | 'or')[]
  ) {
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

    const res1 = this.conditionalComposition(part1Conditions, part1Types);
    const res2 = this.conditionalComposition(part2Conditions, part2Types);

    return res1 || res2;
  }

  public async checkInclusion(
    cust: CustomerDocument,
    inclusionCriteria: InclusionCriteria,
    account?: Account
  ) {
    if (cust.isFreezed) return false;

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
              !(await this.conditionalCompare(
                custAttr,
                inclusionCriteria.conditions[index].value,
                inclusionCriteria.conditions[index].condition,
                { account }
              ))
            ) {
              return false;
            }
          } else {
            if (
              !this.operableCompare(
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
              await this.conditionalCompare(
                custAttr,
                inclusionCriteria.conditions[index].value,
                inclusionCriteria.conditions[index].condition,
                { account }
              )
            ) {
              found = true;
            }
          } else {
            if (
              this.operableCompare(
                custAttr,
                inclusionCriteria.conditions[index].value
              )
            )
              found = true;
          }
        }
        return found;
    }
  }
}
