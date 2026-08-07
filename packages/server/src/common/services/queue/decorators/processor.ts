import { Scope, SetMetadata } from '@nestjs/common';
import { PROCESSOR_METADATA } from '../queue.constants';
import { ProcessorOptions } from '../interfaces';

export function Processor(
  queueName: string,
  processorOptions: ProcessorOptions = {}): ClassDecorator {

  const options = {
  	name: queueName,
    processorOptions,
  };

  return (target: Function) => {
    SetMetadata(PROCESSOR_METADATA, options)(target);
  };
}