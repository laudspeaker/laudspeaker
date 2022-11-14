import { BaseJwtHelper } from '../../common/helper/base-jwt.helper';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entities/accounts.entity';
import * as bcrypt from 'bcryptjs';
import { CustomersService } from '../customers/customers.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AccountsService extends BaseJwtHelper {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @Inject(CustomersService) private customersService: CustomersService,
    @Inject(AuthService) private authService: AuthService
  ) {
    super();
  }

  findAll(): Promise<Account[]> {
    return this.accountsRepository.find();
  }

  findOne(user: Express.User | { id: string }): Promise<Account> {
    return this.accountsRepository.findOneBy({ id: (<Account>user).id });
  }

  findOneByAPIKey(apiKey: string): Promise<Account> {
    return this.accountsRepository.findOneBy({ apiKey: apiKey });
  }

  async update(
    user: Express.User,
    updateUserDto: UpdateAccountDto
  ): Promise<Account> {
    const oldUser = await this.findOne(user);
    // if user change password
    let password = oldUser.password;

    if (updateUserDto.newPassword) {
      const isPasswordValid: boolean = bcrypt.compareSync(
        updateUserDto.currentPassword,
        password
      );

      if (!isPasswordValid) {
        throw new HttpException(
          'Invalid current password',
          HttpStatus.BAD_REQUEST
        );
      }

      if (updateUserDto.newPassword !== updateUserDto.verifyNewPassword)
        throw new HttpException("Passwords don't match", 400);

      password = this.encodePassword(updateUserDto.newPassword);
      delete updateUserDto.currentPassword;
      delete updateUserDto.newPassword;
      delete updateUserDto.verifyNewPassword;
    }

    if (updateUserDto.expectedOnboarding) {
      oldUser.currentOnboarding = [];
    }

    if (
      updateUserDto.finishedOnboarding &&
      !oldUser.currentOnboarding.includes(updateUserDto.finishedOnboarding) &&
      oldUser.expectedOnboarding.includes(updateUserDto.finishedOnboarding)
    ) {
      oldUser.currentOnboarding.push(updateUserDto.finishedOnboarding);
      delete updateUserDto.finishedOnboarding;
      updateUserDto.onboarded =
        oldUser.expectedOnboarding.length === oldUser.currentOnboarding.length;
    }

    let verified = oldUser.verified;
    if (oldUser.email !== updateUserDto.email) {
      verified = false;
      if (oldUser.customerId) {
        const customer = await this.customersService.findById(
          oldUser,
          oldUser.customerId
        );

        customer.verified = false;
        await customer.save();
      }
    }

    const updatedUser = await this.accountsRepository.save({
      ...oldUser,
      ...updateUserDto,
      password,
      verified,
    });

    if (!verified) await this.authService.requestVerification(updatedUser);

    return updatedUser;
  }

  async updateApiKey(user: Express.User): Promise<string> {
    const newKey = this.generateApiKey();
    const oldUser = await this.findOne(user);

    await this.accountsRepository.save({
      ...oldUser,
      apiKey: newKey,
    });

    return newKey;
  }

  async remove(user: Express.User): Promise<void> {
    await this.accountsRepository.delete((<Account>user).id);
  }
}
