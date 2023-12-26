import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { AuthController } from './auth.controller';
import { AuthHelper } from './auth.helper';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ApiKeyStrategy } from './strategies/apiKey.strategy';
import { Template } from '../templates/entities/template.entity';
import { Workflow } from '../workflows/entities/workflow.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { BullModule } from '@nestjs/bullmq';
import { Verification } from './entities/verification.entity';
import { CustomersModule } from '../customers/customers.module';
import { Recovery } from './entities/recovery.entity';
import { JourneysModule } from '../journeys/journeys.module';
import { StepsModule } from '../steps/steps.module';
import { OrganizationTeam } from '../organizations/entities/organization-team.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt', property: 'user' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_KEY,
        signOptions: { expiresIn: process.env.JWT_EXPIRES },
      }),
    }),
    TypeOrmModule.forFeature([
      Account,
      Audience,
      Template,
      Verification,
      Workflow,
      Recovery,
      OrganizationTeam,
    ]),
    BullModule.registerQueue({
      name: 'message',
    }),
    CustomersModule,
    forwardRef(() => JourneysModule),
    forwardRef(() => StepsModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthHelper, JwtStrategy, ApiKeyStrategy],
  exports: [AuthService, AuthHelper],
})
export class AuthModule {}
