export interface JobMetaData {
  id: string,
  priority: number,
  error: {
    message: string,
    stacktrace: string,
  },
}