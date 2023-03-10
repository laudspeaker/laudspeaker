import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Injectable()
export class DevelopmentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (!isDevelopment) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
    return true;
  }
}

