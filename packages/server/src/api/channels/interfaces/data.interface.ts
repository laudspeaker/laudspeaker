export interface Credentials<T> {
  credentials: T;
  metadata?: any;
}
export interface ProviderData<T> {
  data: T;
  metadata?: any;
}
export interface SendingData<T> {
  data: T;
  metadata: {
    stepID: string;
    customerID: string;
    templateID: string;
    workspaceID: string;
  };
}
export interface CallbackData<T> {
  data: T;
  metadata?: any;
}
export interface SetupData<T> {
  data: T;
  metadata?: any;
}
