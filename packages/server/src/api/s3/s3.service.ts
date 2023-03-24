import {
  HttpException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Account } from '../accounts/entities/accounts.entity';

@Injectable()
export class S3Service {
  AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_KEY_SECRET,
  });

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService
  ) {}

  async uploadFile(file, account: Account) {
    const { originalname } = file;

    return await this.s3_upload(
      file.buffer,
      this.AWS_S3_BUCKET,
      String(account.id) + Date.now().toString() + originalname,
      file.mimetype
    );
  }

  async s3_upload(file, bucket, key, mimetype) {
    const params = {
      Bucket: bucket,
      Key: key,
      Body: file,
      ACL: 'public-read',
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: 'ap-south-1',
      },
    };

    try {
      this.logger.log(
        `Upload file: Bucket: ${params.Bucket}, Key: ${params.Key}`
      );
      const s3Response = await this.s3.upload(params).promise();
      this.logger.log('File uploaded');

      return { url: s3Response.Location, key: s3Response.Key };
    } catch (e) {
      this.logger.error(e);
      throw new HttpException('Error while trying to delete file.', 500);
    }
  }

  async deleteFile(key: string, account: Account) {
    if (!key.startsWith(account.id)) {
      throw new HttpException('You are not allowed to delete this file.', 500);
    }

    try {
      await this.s3
        .deleteObject({
          Bucket: this.AWS_S3_BUCKET,
          Key: key,
        })
        .promise();
    } catch (error) {
      this.logger.error(error);
      throw new HttpException('Error while trying to delete file.', 500);
    }
  }
}

