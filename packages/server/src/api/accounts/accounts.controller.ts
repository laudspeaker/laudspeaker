import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  Controller,
  Inject,
  LoggerService,
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

@Controller('accounts')
export class AccountsController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly accountsService: AccountsService,
    private readonly s3Service: S3Service
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(@Req() { user }: Request) {
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
  }

  @Get('/settings')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getUserSettings(@Req() { user }: Request) {
    const userData = await this.accountsService.findOne(user);
    return transformToObject(userData, AccountSettingsResponse);
  }

  @Patch('keygen')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async generateApiKey(@Req() { user }: Request) {
    return await this.accountsService.updateApiKey(user);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async update(
    @Req() { user }: Request,
    @Body() updateUserDto: UpdateAccountDto
  ) {
    const data = await this.accountsService.update(user, updateUserDto);
    return transformToObject(data, AccountSettingsResponse);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  remove(@Req() { user }: Request, @Body() removeAccountDto: RemoveAccountDto) {
    return this.accountsService.remove(user, removeAccountDto);
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
