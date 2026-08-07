export interface ProcessorOptions {
  prefetchCount?: number,
  maxRetries?: {
    count?: number,
    delayMS?: number,
  }
}