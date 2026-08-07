import { RMQConnectionManager } from './rmq-connection-manager';
import { QueueManager } from './queue-manager';
import { QueueType, QueueDestination } from '../types';
import { Producer } from './producer';
import { Inject, Logger } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

export class WorkOrchestrator {

  private queue: QueueType;
  private queueName: string;
  private processor;
  private processorOptions;
  private connectionMgr: RMQConnectionManager;

  private consumerOptions = {
    noAck: false,
  };
  private running;
  private closing: Promise<void> = null;
  private closed;

  @Inject(WINSTON_MODULE_NEST_PROVIDER)
  private readonly logger: Logger;

  constructor(
    queue: QueueType,
    processor,
    processorOptions,
    connectionMgr: RMQConnectionManager) {
    this.queue = queue;
    this.queueName = QueueManager.getQueueName(this.queue, QueueDestination.PENDING);
    this.processor = processor;
    this.processorOptions = processorOptions
    this.connectionMgr = connectionMgr;
  }

  async setupListeners() {
    const channel = this.connectionMgr.channelObj;

    await channel.assertQueue(
      this.queueName,
      QueueManager.queueOptions 
    );

    let prefetchCount = this.processorOptions.prefetchCount;

    if (!prefetchCount)
      prefetchCount = parseInt(process.env.RMQ_QUEUE_PREFETCH_COUNT ?? '100');

    await channel.prefetch(prefetchCount);

    const consumerTag = this.generateConsumerTag();

    const options = {
      ...this.consumerOptions,
      consumerTag,
    }

    const self = this;

    const consumeHandler = async (msg) => {
      return self.handleMessage(
        channel,
        msg,
        self.queue
      );
    }

    channel.consume(
      this.queueName,
      consumeHandler,
      options,
    );
  }

  close(): Promise<void> {
    // this.logger.verbose("RMQ: WorkOrchestrator Closing");
    
    if (this.closing) {
      return this.closing;
    }

    this.closing = (async () => {
      // this.emit('closing', 'closing queue');

      await Promise.resolve()
        .finally(() => this.connectionMgr.close())
        // .finally(() => this.emit('closed'));
      this.closed = true;
    })();

    return this.closing;
  }

  private generateConsumerTag() {
    return `${process.env.LAUDSPEAKER_PROCESS_TYPE}-${process.pid}`;
  }

  private parseMsg(msg) {
    return msg.content.toString();
  }

  // messageAsString, messageAsJSON, messageAsJob
  private jobFromMsg(msg) {
    const content = this.parseMsg(msg);

    try {
      const parsedJSON = JSON.parse(content);
      return parsedJSON;
    }
    catch (error) {
      console.log(content);
      throw error;
    }
  }

  private async handleMessage(channel, msg, queue: QueueType) {
    const self = this;

    const job = this.jobFromMsg(msg);
    let result;

    try {
      result = await self.processor.process.call(self.processor, job);

      await self.handleProcessorSuccess(
        channel,
        msg,
        job,
        queue,
        self.processor,
        result);
    }
    catch (error) {
      await self.handleProcessorError(
        channel,
        msg,
        job,
        queue,
        self.processor,
        error);
    }
  }

  private async handleProcessorSuccess(channel, msg, job, queue, processor, result) {
    return this.completeJob(channel, msg, job, queue, processor);
  }

  private async handleProcessorError(channel, msg, job, queue, processor, error) {
    const jobDeliveryCount = this.getJobDeliveryCount(job);

    const maxRetries = this.processorOptions?.maxRetries?.count ?? 3;

    if (jobDeliveryCount >= maxRetries ) {
      return this.failJob(
        channel,
        msg,
        job,
        queue,
        processor,
        error
      );
    } else {
      return this.retryJob(
        channel,
        msg,
        job,
        queue,
        processor,
        error,
        this.processorOptions?.maxRetries?.delayMS
      );
    }
  }

  private getJobDeliveryCount(job): number {
    return job?.metadata?.deliveryCount
      ? parseInt(job.metadata.deliveryCount)
      : 0;
  }

  private getNewJobAfterError(job, error) {
    job.metadata.deliveryCount = this.getJobDeliveryCount(job) + 1;
    job.metadata.error = {
      message: error.message,
      stacktrace: error.stack
    }

    return job;
  }

  private async completeJob(channel, msg, job, queue, processor) {
    await processor.onComplete(job);

    await Producer.addToCompleted(queue, job);

    return this.messageACK(channel, msg);
  }

  private async retryJob(channel, msg, job, queue, processor, error, delayMS = 0) {
    await processor.onRetry(job);

    if (delayMS > 0 ) {
      await new Promise((resolve) => setTimeout(resolve, delayMS));
    }

    job = this.getNewJobAfterError(job, error);

    await Producer.requeueJob(queue, job);

    return this.messageACK(channel, msg);
  }

  private async failJob(channel, msg, job, queue, processor, error) {
    await processor.onFail(job);

    job = this.getNewJobAfterError(job, error);

    await Producer.addToFailed(queue, job);

    return this.messageACK(channel, msg);
  }

  private async messageACK(channel, msg) {
    return channel.ack(msg);
  }

  private async messgaeNACK(channel, msg) {
    return channel.nack(msg);
  }
}