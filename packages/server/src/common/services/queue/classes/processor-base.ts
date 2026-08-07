import { OnModuleDestroy } from '@nestjs/common';
import { WorkOrchestrator } from './work-orchestrator';

export abstract class ProcessorBase<T extends WorkOrchestrator = WorkOrchestrator>
  implements OnModuleDestroy
{
  private readonly _worker: T | undefined;

  get worker(): T {
    if (!this._worker) {
      throw new Error(
        '"WorkOrchestrator" has not yet been initialized.',
      );
    }

    return this._worker;
  }

  abstract process(job: any): Promise<any>;

  async onComplete(job: any): Promise<any> {
    // console.log("COMPLETE");
  }

  async onFail(job: any, error): Promise<any> {
    // console.log("FAIL");
  }

  async onRetry(job: any, error): Promise<any> {
    // console.log("RETRY");
  }

  async onModuleDestroy() {
    return this._worker?.close();
  }
}