import { Temporal } from '@js-temporal/polyfill';

export enum AnalyticsProviderTypes {
  POSTHOG,
  AMPLITUDE,
  MIXPANEL,
  LAUDSPEAKER,
}

export enum StepType {
  START,
  EXIT,
  MESSAGE,
  TIME_WINDOW,
  TIME_DELAY,
  ATTRIBUTE_BRANCH,
  LOOP,
  AB_TEST,
  RANDOM_COHORT_BRANCH,
  WAIT_UNTIL_BRANCH,
}

export class TimeWindow {
  from: Date;
  to: Date;
}

export enum EventConditionElementsFilter {
  TEXT = 'text',
  TAG_NAME = 'tag name',
}

export enum FilterByOption {
  CUSTOMER_KEY = 'customer key',
  ELEMENTS = 'elements',
}

export class AnalyticsEventConditions {
  value: any;
  attribute?: string;
  condition?: string; // exists,contains,isgreaterthan,etc
  key?: string;
  type?: string;
  comparisonType?: string;
  relationWithNext?: 'and' | 'or'; //todo: add grouping for conditions
  isArray?: boolean;
  filterBy?: FilterByOption;
  elementOrder?: number;
  filter?: EventConditionElementsFilter;
}

export type AnalyticsProviderParams =
  | PosthogProviderParams
  | LaudspeakerProviderParams;

export enum LaudspeakerProviderParams {}

export enum PosthogProviderParams {
  TRACK = 'track',
  PAGE = 'page',
  RAGECLICK = 'Rageclick',
  TYPED = 'Typed (Change)',
  AUTOCAPTURE = 'Autocapture (Click)',
  SUBMIT = 'Submit',
  PAGEVIEW = 'Pageview',
  PAGELEAVE = 'Pageleave',
}

/*
 * Top level interface for a branch.
 */
export class Branch {
  /** Step ID (UUID) */
  destination: string;
}

/*
 * Extend branch with percentage for random branching.
 */
export class RandomBranch extends Branch {
  percentage: number;
}

/*
 * Top level interface for any type of event that can trigger a step
 */
export class Event extends Branch {}

/*
 * Events associated with messages; for example, if a customer
 * opens an email or receives a push notification.
 */
export class MessageEvent extends Event {}

/*
 * Events associated with product analytics, for example Posthog
 * or Amplitude.
 */
export class AnalyticsEvent extends Event {
  provider: AnalyticsProviderTypes;
  providerParams: AnalyticsProviderParams;
  conditions: AnalyticsEventConditions[];
}

/*
 * Events associated with customer attributes changing, for example
 * a customer changing from a 'free' to a 'paid' plan.
 */
export class AttributeChangeEvent extends Event {}

/*
 * Top level interface for any platform data that we are
 * sorting/switching on.
 */
export class Attribute extends Branch {}

/*
 * Customer attributes, for example
 * a customer's 'plan_type' field might be 'free' or 'paid'.
 * Note: This implicitly contains a customer's attribute
 * change history as well, as that is also part of their attributes.
 * Sample Customer Document:
 *      {
 *          id: ObjectId('38nxu98xnu320zn3x98n83unx'),
 *          email: 'user@example.com',
 *          _attribute_history:
 *              [
 *                {
 *                  field: 'email'
 *                  from: 'user_one@example.com'
 *                  to:'user@example.com'
 *                }
 *              ]
 *       }
 * Sample comparison: 'email' 'string' 'contains' 'laudspeaker'
 */
export class CustomerAttribute extends Attribute {
  attrID: string; // Primary key of customer attribute
  comparisonType: string; // type of attribute you are checking, i.e. string
  condition: string; // isEqual greaterThan etc
  comparisonValue: string; // value to compare it to
}

/*
 * Message event history, for example a customer
 * might have opened the 'Welcome' email twice.
 */
export class MessageEventHistoryAttribute extends Attribute {}

/*
 * Analytics event history, for example a customer
 * might have opened the 'Welcome' email twice.
 */
export class AnalyticsEventHistoryAttribute extends Attribute {}

/*
 * Top level step metadata interface.
 */
export class StepTypeMetadata {}

/*
 * Exit step metadata: no additional properties needed.
 */
export class ExitStepMetadata extends StepTypeMetadata {}

/*
 * Parent Metadata interface for steps with only a single
 * branch: Loop, Start, Message, Time Delay, Time Window. Single
 * property destination holds step ID of next step.
 */
export class SingleBranchMetadata extends StepTypeMetadata {
  /** Step ID (UUID) */
  destination: string;
}

/*
 * Start step metadata: no additional properties needed.
 */
export class StartStepMetadata extends SingleBranchMetadata {}

/*
 * Loop step metadata: no additional properties needed.
 */
export class LoopStepMetadata extends SingleBranchMetadata {}

/*
 * Message step metadata, includes messaging channel type and
 * template ID.
 */
export class MessageStepMetadata extends SingleBranchMetadata {
  /** TODO: Convert to Enum */
  channel: string;
  /** Template ID (UUID) */
  template: string;
}

export class TimeWindowStepMetadata extends SingleBranchMetadata {
  window: TimeWindow;
}

export class TimeDelayStepMetadata extends SingleBranchMetadata {
  delay: Temporal.Duration;
}

export class MultiBranchMetadata extends StepTypeMetadata {
  branches: Branch[];
}

export class WaitUntilStepMetadata extends MultiBranchMetadata {
  timeBranch: TimeWindow | Temporal.Duration;
}

export type AllStepTypeMetadata =
  | WaitUntilStepMetadata
  | TimeDelayStepMetadata
  | TimeWindowStepMetadata
  | RandomBranch
  | MessageEvent
  | AttributeChangeEvent
  | AnalyticsEvent
  | MessageStepMetadata
  | LoopStepMetadata
  | StartStepMetadata
  | ExitStepMetadata
  | AnalyticsEventHistoryAttribute
  | MessageEventHistoryAttribute
  | CustomerAttribute;

const a = (a: AllStepTypeMetadata) => {
  if (a instanceof WaitUntilStepMetadata) console.log(a.timeBranch);
};
