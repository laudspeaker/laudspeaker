import {
  Body,
  Controller,
  Inject,
  Post,
  ClassSerializerInterceptor,
  UseInterceptors,
  UseGuards,
  Req,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { Account } from '@/api/accounts/entities/accounts.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from '../auth/dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  @Inject(AuthService)
  public readonly service: AuthService;

  @Post('register')
  @UseInterceptors(ClassSerializerInterceptor)
  public async register(@Body() body: RegisterDto): Promise<Account | never> {
    return this.service.register(body);
  }

  @Post('login')
  public async login(@Body() body: LoginDto): Promise<string | never> {
    return this.service.login(body);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  public async refresh(@Req() { user }: Request): Promise<string | never> {
    return this.service.refresh(<Account>user);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  public async verify() {
    return;
  }

  @Patch('verify-email/:id')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  public async verifyEmail(@Req() { user }: Request, @Param('id') id: string) {
    return this.service.verifyEmail(<Account>user, id);
  }

  @Patch('resend-email')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  public async resendEmail(@Req() { user }: Request) {
    return this.service.requestVerification(<Account>user);
  }
}
