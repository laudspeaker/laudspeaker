import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  Controller,
  Inject,
  Logger,
  Get,
  Body,
  Patch,
  Req,
  Delete,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
  Post,
  UploadedFile,
  Param,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Request } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { transformToObject } from '../../common/helper/transformers';
import { AccountSettingsResponse } from './response/acccountSettings.response';
import { RemoveAccountDto } from './dto/remove-account.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Account } from './entities/accounts.entity';
import { imageFileFilter } from '../auth/middleware/file.validation';
import { S3Service } from '../s3/s3.service';
import { randomUUID } from 'crypto';
// TODO: remove after testing
import { exit } from 'process';

@Controller('accounts')
export class AccountsController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly accountsService: AccountsService,
    private readonly s3Service: S3Service
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: AccountsController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  debug(message, method, session, user = 'ANONYMOUS') {
    this.logger.debug(
      message,
      JSON.stringify({
        class: AccountsController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  warn(message, method, session, user = 'ANONYMOUS') {
    this.logger.warn(
      message,
      JSON.stringify({
        class: AccountsController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  error(error, method, session, user = 'ANONYMOUS') {
    this.logger.error(
      error.message,
      error.stack,
      JSON.stringify({
        class: AccountsController.name,
        method: method,
        session: session,
        cause: error.cause,
        name: error.name,
        user: user,
      })
    );
  }
  verbose(message, method, session, user = 'ANONYMOUS') {
    this.logger.verbose(
      message,
      JSON.stringify({
        class: AccountsController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(@Req() { user }: Request) {
    const session = randomUUID();
    this.debug(
      `Finding ${JSON.stringify({ id: (<Account>user).id })}`,
      this.findOne.name,
      session,
      (<Account>user).id
    );
    try {
      const data = await this.accountsService.accountsRepository
        .createQueryBuilder('ac')
        .select(
          `ac.*, (300 - extract ('epoch' from (now() - "vr"."createdAt")::interval)) as secondtillunblockresend`
        )
        .leftJoin(
          'verification',
          'vr',
          `ac.id = vr.accountId and extract ('epoch' from (now() - "vr"."createdAt")::interval) < 300 AND vr.status = 'sent'`
        )
        .where(`ac.id = :userId`, {
          // @ts-ignore
          userId: <Account>user.id,
        })
        .orderBy('vr.createdAt', 'DESC')
        .limit(1)
        .execute();

      return data?.[0];
    } catch (e) {
      this.error(e, this.findOne.name, session, (<Account>user).id);
      throw e;
    }
  }

  @Get('/settings')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getUserSettings(@Req() { user }: Request) {
    const session = randomUUID();
    this.debug(
      `Getting settings for ${JSON.stringify({ id: (<Account>user).id })}`,
      this.getUserSettings.name,
      session,
      (<Account>user).id
    );
    try {
      const userData = await this.accountsService.findOne(user, session);
      // TODO: remove after testing
      exit();
      return transformToObject(userData, AccountSettingsResponse);
    } catch (e) {
      this.error(e, this.getUserSettings.name, session, (<Account>user).id);
      throw e;
    }
  }

  @Patch('keygen')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async generateApiKey(@Req() { user }: Request) {
    const session = randomUUID();
    this.debug(
      `Generating API key for ${JSON.stringify({ id: (<Account>user).id })}`,
      this.generateApiKey.name,
      session,
      (<Account>user).id
    );
    try {
      return await this.accountsService.updateApiKey(user, session);
    } catch (e) {
      this.error(e, this.generateApiKey.name, session, (<Account>user).id);
      throw e;
    }
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async update(
    @Req() { user }: Request,
    @Body() updateUserDto: UpdateAccountDto
  ) {
    const session = randomUUID();
    this.debug(
      `Updating ${JSON.stringify({ id: (<Account>user).id })}`,
      this.update.name,
      session,
      (<Account>user).id
    );
    try {
      const data = await this.accountsService.update(
        user,
        updateUserDto,
        session
      );
      return transformToObject(data, AccountSettingsResponse);
    } catch (e) {
      this.error(e, this.update.name, session, (<Account>user).id);
      throw e;
    }
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  remove(@Req() { user }: Request, @Body() removeAccountDto: RemoveAccountDto) {
    const session = randomUUID();
    this.debug(
      `Deleting ${JSON.stringify({ id: (<Account>user).id })}`,
      this.remove.name,
      session,
      (<Account>user).id
    );
    try {
      return this.accountsService.remove(user, removeAccountDto, session);
    } catch (e) {
      this.error(e, this.remove.name, session, (<Account>user).id);
      throw e;
    }
  }

  @Post('/upload-public-media')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10485760,
      },
      fileFilter: imageFileFilter,
    })
  )
  async uploadMedia(
    @Req() { user }: Request,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.s3Service.uploadFile(file, <Account>user);
  }

  @Post('/delete-media/:key')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async deleteMedia(@Req() { user }: Request, @Param('key') key: string) {
    return this.s3Service.deleteFile(key, <Account>user);
  }
}
