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
  AWS_S3_CUSTOMERS_IMPORT_BUCKET = process.env.AWS_S3_CUSTOMERS_IMPORT_BUCKET;
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
      file.mimetype,
      'public-read'
    );
  }

  async uploadCustomerImportFile(file, account: Account) {
    const { originalname } = file;

    return await this.s3_upload(
      file.buffer,
      this.AWS_S3_CUSTOMERS_IMPORT_BUCKET,
      String(account.id) + Date.now().toString() + originalname,
      file.mimetype
    );
  }

  async uploadCustomerImportPreviewErrorsFile(file) {
    const { originalname } = file;

    const data = await this.s3_upload(
      file.buffer,
      this.AWS_S3_CUSTOMERS_IMPORT_BUCKET,
      originalname,
      file.mimetype
    );

    return await this.generateImportPresignedUrl(data.key);
  }

  generateImportPresignedUrl(objectKey: string) {
    const params = {
      Bucket: this.AWS_S3_CUSTOMERS_IMPORT_BUCKET,
      Key: objectKey,
      Expires: 60 * 60 * 24,
    };

    return new Promise((resolve, reject) => {
      this.s3.getSignedUrl('getObject', params, (err, url) => {
        if (err) {
          reject(err);
        } else {
          resolve(url);
        }
      });
    });
  }

  async s3_upload(file, bucket, key, mimetype, ACL?: string) {
    const params = {
      Bucket: bucket,
      Key: key,
      Body: file,
      ACL: ACL,
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
      throw new HttpException('Error while trying to upload file.', 500);
    }
  }

  async getImportedCSVReadStream(key: string) {
    const s3Stream = this.s3
      .getObject({ Bucket: this.AWS_S3_CUSTOMERS_IMPORT_BUCKET, Key: key })
      .createReadStream();

    return s3Stream;
  }

  async deleteFile(
    key: string,
    account: Account,
    isCustomerImportBucket = false
  ) {
    if (!key.startsWith(account.id)) {
      throw new HttpException('You are not allowed to delete this file.', 500);
    }

    try {
      await this.s3
        .deleteObject({
          Bucket: isCustomerImportBucket
            ? this.AWS_S3_CUSTOMERS_IMPORT_BUCKET
            : this.AWS_S3_BUCKET,
          Key: key,
        })
        .promise();
    } catch (error) {
      this.logger.error(error);
      throw new HttpException('Error while trying to delete file.', 500);
    }
  }
}
