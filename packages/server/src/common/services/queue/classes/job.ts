import { JobInterface } from '../interfaces/job';
import { JobData } from '../interfaces/job-data';
import { JobMetaData } from '../interfaces/job-metadata';

export class Job implements JobInterface {
  name: string;
  data: JobData;
  metadata: JobMetaData;

  constructor(
    name: string,
    data: JobData,
    metadata: JobMetaData) {
    this.name = name;
    this.data = data;
    this.metadata = metadata;
  }
}