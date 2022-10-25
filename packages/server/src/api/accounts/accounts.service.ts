import { BaseJwtHelper } from '../../common/helper/base-jwt.helper';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entities/accounts.entity';

@Injectable()
export class AccountsService extends BaseJwtHelper {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>
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
      if (
        oldUser.password !== this.encodePassword(updateUserDto.currentPassword)
      )
        throw new HttpException('Invalid current password', 400);

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

    const updatedUser = await this.accountsRepository.save({
      ...oldUser,
      ...updateUserDto,
      password,
    });

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
