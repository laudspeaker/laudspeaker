import { Temporal } from '@js-temporal/polyfill';

export enum AnalyticsProviderTypes {
  POSTHOG = 'posthog',
  AMPLITUDE = 'amplitude',
  MIXPANEL = 'mixpanel',
  LAUDSPEAKER = 'custom',
  MOBILE = 'mobile',
  TRACKER = 'tracker',
}

export enum StepType {
  START = 'start',
  EXIT = 'exit',
  MESSAGE = 'message',
  TIME_WINDOW = 'timeWindow',
  TIME_DELAY = 'timeDelay',
  ATTRIBUTE_BRANCH = 'userAttribute',
  LOOP = 'jumpTo',
  AB_TEST = 'ABTest',
  RANDOM_COHORT_BRANCH = 'randomCohort',
  WAIT_UNTIL_BRANCH = 'waitUntil',
  TRACKER = 'tracker',
  MULTISPLIT = 'multisplit',
  EXPERIMENT = 'experiment',
}

export enum TimeWindowTypes {
  SPEC_DATES = 'SpecDates',
  SPEC_WEEK_DAYS = 'SpecWeekDays',
}

export class TimeWindow {
  from: Temporal.Instant;
  to: Temporal.Instant;
  windowType?: TimeWindowTypes;
  onDays?: number[];
  fromTime?: string;
  toTime?: string;
}

export enum ElementConditionFilter {
  TEXT = 'text',
  TAG_NAME = 'tag_name',
}

export enum FilterByOption {
  CUSTOMER_KEY = 'property',
  ELEMENTS = 'element',
}

export class PropertyCondition {
  key: string;
  comparisonType: string;
  keyType: string;
  value: any;
}

export class ElementCondition {
  order: number;
  filter: ElementConditionFilter;
  comparisonType: string;
  filterType: string;
  value: string;
}

export class AnalyticsEventCondition {
  type?: FilterByOption;
  elementCondition?: ElementCondition;
  propertyCondition?: PropertyCondition;
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

export enum Channel {
  EMAIL = 'email',
  SLACK = 'slack',
  SMS = 'sms',
  FIREBASE = 'firebase',
  PUSH = 'push',
  WEBHOOK = 'webhook',
  MODAL = 'modal',
  CUSTOM_COMPONENT = 'custom_component',
}

export enum CustomComponentAction {
  SHOW = 'show',
  HIDE = 'hide',
}

/*
 * Top level interface for a branch.
 */
export class CommonBranch {
  index: number;
  /** Step ID (UUID) */
  destination: string;
}

/*
 * Extend branch with percentage for random branching.
 */
export class ExperimentBranch extends CommonBranch {
  ratio: number;
}

/*
 * Top level interface for any type of event that can trigger a step
 */
export class EventBranch extends CommonBranch {
  events: Event[];
  relation?: string;
}

/*
 * Primary grouping of event information that can
 * be grouped via and/or.
 */
export class Event {}

/*
 * Events associated with messages; for example, if a customer
 * opens an email or receives a push notification.
 */
export class MessageEvent extends Event {
  providerType: string; // Email, SMS, etc
  eventCondition: string; // Received, opened, delivered, etc
  happenCondition: string; // has, has not
  journey: string; // Journey ID
  step: string; // StepID or ANY
}

/*
 * Events associated with messages; for example, if a customer
 * opens an email or receives a push notification.
 */
export class ComponentEvent extends Event {
  event: string;
  trackerID: string;
}

/*
 * Events associated with product analytics, for example Posthog
 * or Amplitude.
 */
export class AnalyticsEvent extends Event {
  provider: AnalyticsProviderTypes; // client/src/types/Workflow.ts: ProviderType
  event: string;
  conditions?: AnalyticsEventCondition[];
  relation?: string; // and/or
}

/*
 * Events associated with customer attributes changing, for example
 * a customer changing from a 'free' to a 'paid' plan.
 */
export class AttributeChangeEvent extends Event {
  attributeName: string; // FirstName, email, etc
  happenCondition: string; // changed or changed to
  value?: string; // Optional, indicates what we are waiting for the field to change to
  valueType?: string; //type of value that field has changed to
}

/*
 * Top level interface for any platform data that we are
 * sorting/switching on.
 */
export class AttributeConditions extends CommonBranch {
  conditions: any;
}

/*
 * Secondary grouping of platform data that shares relation
 * (and/or)
 */
export class AttributeGroup {
  attributes: Attribute[];
  relation: string;
}

/*
 * Primary grouping of platform data that shares relation
 * (and/or)
 */
export class Attribute {}

/*
 * Customer attributes, for example
 * a customer's 'plan_type' field might be 'free' or 'paid'.
 * Note: This implicitly contains a customer's attribute
 * change history as well, as that is also part of their attributes.
 * Sample Customer Document:
 *      {
 *          id: ObjectId('38nxu98xnu320zn3x98n83unx'),
 *          email: 'user_two@example.com',
 *          _attribute_history:
 *              [
 *                {
 *                  field: 'email'
 *                  from: 'user_one@example.com'
 *                  to:'user_two@example.com',
 *                  timestamp: '12:34:56 7890 GMT'
 *                }
 *              ]
 *       }
 * Sample comparison: 'email' 'string' 'contains' 'laudspeaker'
 */
export class CustomerAttribute extends Attribute {
  key: string; // firstName,lastName etc.
  keyType: string; //boolean,number,string,date,etc
  comparisonType: string; // equals,doesnotequal,etc.
  value: string; // mahamad, charawi,etc.
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
  channel: Channel;
  /** Template ID (UUID) */
  template: string;
  selectedPlatform?: string;
  connectionId: string;
  sendingOptionId?: string;
}

/**
 * Custom Component Step metadata, need extra fields for what actions to
 * take (show/hide), what to change fields to, and the human readable
 * step name.
 */
export class CustomComponentStepMetadata extends MessageStepMetadata {
  action: CustomComponentAction;
  humanReadableName: string;
  pushedValues: Record<string, any>;
}

export class TimeWindowStepMetadata extends SingleBranchMetadata {
  window: TimeWindow;
}

export class TimeDelayStepMetadata extends SingleBranchMetadata {
  delay: Temporal.Duration;
}

export class CommonMultiBranchMetadata extends StepTypeMetadata {
  branches: CommonBranch[];
}

export class AttributeSplitMetadata extends CommonMultiBranchMetadata {
  // Step ID of
  allOthers: string;
}

export class WaitUntilStepMetadata extends CommonMultiBranchMetadata {
  timeBranch: TimeWindowStepMetadata | TimeDelayStepMetadata;
}

export class ExperimentMetadata {
  branches: ExperimentBranch[];
}

export type AllStepTypeMetadata =
  | WaitUntilStepMetadata
  | TimeDelayStepMetadata
  | TimeWindowStepMetadata
  | ExperimentBranch
  | MessageEvent
  | AttributeChangeEvent
  | AnalyticsEvent
  | MessageStepMetadata
  | CustomComponentStepMetadata
  | LoopStepMetadata
  | StartStepMetadata
  | ExitStepMetadata
  | AnalyticsEventHistoryAttribute
  | MessageEventHistoryAttribute
  | CustomerAttribute;
