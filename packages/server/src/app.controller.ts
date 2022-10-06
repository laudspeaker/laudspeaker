import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return 'laudspeaker API v 1.0';
  }
}
