import {
  Controller,
  Get,
  Headers,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ModalsService } from './modals.service';
import { RavenInterceptor } from 'nest-raven';
import { ApiKeyAuthGuard } from '../auth/guards/apikey-auth.guard';
import { Request } from 'express';
import { Account } from '../accounts/entities/accounts.entity';
import { Workspaces } from '../workspaces/entities/workspaces.entity';

@Controller('modals')
export class ModalsController {
  constructor(private modalsService: ModalsService) {}

  @Get('/:customerId')
  @UseGuards(ApiKeyAuthGuard)
  @UseInterceptors(new RavenInterceptor())
  public async requestModal(
    @Req() { user }: Request,
    @Param('customerId') customerId: string
  ) {
    return this.modalsService.getQueuedModalObject(
      <{ account: Account; workspace: Workspaces }>user,
      customerId);
  }
}
