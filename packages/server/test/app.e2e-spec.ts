import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { config } from 'dotenv';
describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env = config().parsed;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
  });

  it('should start', async () => {
    await app.init();
  });

  it('/ (GET)', async () => {
    await app.init();
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('laudspeaker API v 1.0');
  });

  afterEach(async () => {
    await app.close();
  });
});
