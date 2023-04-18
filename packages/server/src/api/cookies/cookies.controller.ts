import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { CookiesService } from './cookies.service';

@Controller('cookies')
export class CookiesController {
  constructor(private cookiesService: CookiesService) {}

  @Get('/set/:id')
  public setCookie(@Res() res: Response, @Param('id') id: string) {
    const { name, value, options } = this.cookiesService.getCookie(id);

    res.cookie(name, value, options);
    res.end();
  }
}
