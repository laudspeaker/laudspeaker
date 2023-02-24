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
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  @Inject(AuthService)
  public readonly service: AuthService;

  @Post('register')
  @UseInterceptors(ClassSerializerInterceptor)
  public async register(@Body() body: RegisterDto) {
    return this.service.register(body);
  }

  @Post('login')
  public async login(@Body() body: LoginDto) {
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

  @Post('reset-password')
  @UseInterceptors(ClassSerializerInterceptor)
  public async requestResetPassword(
    @Body() requestResetPasswordDto: RequestResetPasswordDto
  ) {
    return this.service.requestResetPassword(requestResetPasswordDto);
  }

  @Post('reset-password/:id')
  @UseInterceptors(ClassSerializerInterceptor)
  public async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Param('id') id: string
  ) {
    return this.service.resetPassword(resetPasswordDto, id);
  }
}
