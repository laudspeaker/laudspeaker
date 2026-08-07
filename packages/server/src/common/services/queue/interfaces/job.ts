import { JobData } from './job-data';
import { JobMetaData } from './job-metadata';

export interface JobInterface {
  name: string,
  data: JobData,
  metadata: JobMetaData,
}