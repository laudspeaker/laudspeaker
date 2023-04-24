import { Controller, Get, Headers, Param } from '@nestjs/common';
import { ModalsService } from './modals.service';

@Controller('modals')
export class ModalsController {
  constructor(private modalsService: ModalsService) {}

  @Get('/:customerId')
  public async requestModal(
    @Headers('Authorization') authHeader: string,
    @Param('customerId') customerId: string
  ) {
    const apiKey = authHeader.replace('Api-Key ', '');

    await this.modalsService.validateModalAccess(apiKey, customerId);

    return this.modalsService.getQueuedModalObject(customerId);
  }
}
