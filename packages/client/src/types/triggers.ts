export enum ProviderTypes {
  Posthog = "posthog",
  Custom = "custom",
}

export interface EventCondition {
  key: string;
  type: string;
  value: string;
  comparisonType: string;
  relationWithNext: "and" | "or";
  isArray: boolean;
}

export enum PosthogTriggerParams {
  Track = "track",
  Page = "page",
  Autocapture = "autocapture",
}

export interface EventTrigger {
  providerType: ProviderTypes;
  providerParams: string;
  properties: {
    conditions?: EventCondition[];
  };
}
