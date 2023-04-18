import { Module } from '@nestjs/common';
import { CookiesController } from './cookies.controller';
import { CookiesService } from './cookies.service';

@Module({
  controllers: [CookiesController],
  providers: [CookiesService],
  exports: [CookiesService],
})
export class CookiesModule {}
