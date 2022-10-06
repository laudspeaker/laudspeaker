import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export class BaseJwtHelper {
  // Validate User's password
  public isPasswordValid(password: string, userPassword: string): boolean {
    return bcrypt.compareSync(password, userPassword);
  }

  // Encode User's password
  public encodePassword(password: string): string {
    const salt: string = bcrypt.genSaltSync(10);

    return bcrypt.hashSync(password, salt);
  }

  public generateApiKey(): string {
    const rand = crypto.randomBytes(40);
    const chars =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.repeat(
        5
      );
    let str = '';
    for (let i = 0; i < rand.length; i++) {
      const decimal = rand[i];
      str += chars[decimal];
    }
    return str;
  }
}
