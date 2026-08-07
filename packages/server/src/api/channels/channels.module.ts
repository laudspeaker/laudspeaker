import { Module } from '@nestjs/common';
import { MailgunProvider } from './email/providers/mailgun.provider';
import { MailkiteProvider } from './email/providers/mailkite.provider';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { ProviderFactory } from './interfaces/provider.factory';

function getImportsList() {
  let importList: Array<any> = [];

  return importList;
}
function getProvidersList() {
  let providerList: Array<any> = [MailgunProvider, MailkiteProvider, ChannelsService, ProviderFactory];

  return providerList;
}

function getControllersList() {
  let controllerList: Array<any> = [ChannelsController];

  return controllerList;
}

function getExportsList() {
  let exportList: Array<any> = [MailgunProvider, MailkiteProvider];

  return exportList;
}

@Module({
  imports: getImportsList(),
  providers: getProvidersList(),
  controllers: getControllersList(),
  exports: getExportsList(),
})
export class ChannelsModule { }
