import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../constants/bcrypt.constant';

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  async compare(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
