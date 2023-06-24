import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common/decorators';
import { forwardRef } from '@nestjs/common/utils';
import { Account } from '../accounts/entities/accounts.entity';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { SegmentsService } from '../segments/segments.service';
import { InclusionCriteria } from '../segments/types/segment.type';
import {
  AttributeBranch,
  AttributeGroup,
  CustomerAttribute,
} from '../steps/types/step.interface';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class AudiencesHelper {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @Inject(forwardRef(() => SegmentsService))
    private segmentsService: SegmentsService
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: AudiencesHelper.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  debug(message, method, session, user = 'ANONYMOUS') {
    this.logger.debug(
      message,
      JSON.stringify({
        class: AudiencesHelper.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  warn(message, method, session, user = 'ANONYMOUS') {
    this.logger.warn(
      message,
      JSON.stringify({
        class: AudiencesHelper.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  error(error, method, session, user = 'ANONYMOUS') {
    this.logger.error(
      error.message,
      error.stack,
      JSON.stringify({
        class: AudiencesHelper.name,
        method: method,
        session: session,
        cause: error.cause,
        name: error.name,
        user: user,
      })
    );
  }
  verbose(message, method, session, user = 'ANONYMOUS') {
    this.logger.verbose(
      message,
      JSON.stringify({
        class: AudiencesHelper.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

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

  /**
   * Check a customer document against an inclusion criteria.
   *
   * @param cust Customer Document to check
   * @param inclusionCriteria Frontend inclusion criteria object
   * @param account Owner of customer
   * @returns boolean
   */
  public async checkInclusion(
    cust: CustomerDocument,
    inclusionCriteria: any,
    session: string,
    account?: Account
  ): Promise<boolean> {
    if (cust.isFreezed) return false;

    if (
      !inclusionCriteria ||
      inclusionCriteria.type === 'allCustomers' ||
      !inclusionCriteria.query ||
      !inclusionCriteria.query.statements ||
      !inclusionCriteria.query.statements.length
    )
      return true;

    this.debug(
      `${JSON.stringify({ cust, inclusionCriteria })}`,
      this.checkInclusion.name,
      session
    );
    const ag: AttributeGroup = new AttributeGroup();
    ag.attributes = [];
    for (
      let attributeIndex = 0;
      attributeIndex < inclusionCriteria.query.statements.length;
      attributeIndex++
    ) {
      const attribute = new CustomerAttribute();
      attribute.comparisonType =
        inclusionCriteria.query.statements[attributeIndex].comparisonType;
      attribute.key = inclusionCriteria.query.statements[attributeIndex].key;
      attribute.keyType =
        inclusionCriteria.query.statements[attributeIndex].valueType;
      attribute.value =
        inclusionCriteria.query.statements[attributeIndex].value;
      ag.attributes.push(attribute);
    }
    ag.relation = inclusionCriteria.query.type;
    this.debug(
      `${JSON.stringify({ attributeGroup: ag })}`,
      this.checkInclusion.name,
      session
    );

    switch (ag.relation) {
      case 'all':
        for (
          let attributesIndex = 0;
          attributesIndex < ag.attributes.length;
          attributesIndex++
        ) {
          const attr: any = ag.attributes[attributesIndex];
          if (attr.value) {
            if (
              !(await this.conditionalCompare(
                cust[attr.key],
                attr.value,
                attr.comparisonType,
                { account }
              ))
            ) {
              return false;
            }
          } else {
            if (!this.operableCompare(cust[attr.key], attr.comparisonType))
              return false;
          }
        }
        return true;
      case 'any':
        // eslint-disable-next-line no-case-declarations
        let found = false;
        for (
          let attributesIndex = 0;
          attributesIndex < ag.attributes.length;
          attributesIndex++
        ) {
          const attr: any = ag.attributes[attributesIndex];
          if (attr.value) {
            if (
              await this.conditionalCompare(
                cust[attr.key],
                attr.value,
                attr.comparisonType,
                { account }
              )
            ) {
              found = true;
            }
          } else {
            if (this.operableCompare(cust[attr.key], attr.comparisonType))
              found = true;
          }
        }
        return found;
    }
  }
}
