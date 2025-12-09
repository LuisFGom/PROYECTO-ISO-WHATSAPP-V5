import * as bcrypt from 'bcrypt';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User.entity';
import { UserStatus } from '../../../shared/types/user.types';

export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: { username: string; email: string; password: string }): Promise<User> {
    if (!User.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    if (!User.isValidUsername(data.username)) {
      throw new Error('Username must be 3-50 characters and contain only letters, numbers, and underscores');
    }

    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    const userData = {
      username: data.username,
      email: data.email,
      passwordHash: passwordHash,
      avatarUrl: null,
      status: UserStatus.OFFLINE,
      about: 'Hey there! I am using WhatsApp Clone',
      lastSeen: null,
    };

    const user = await this.userRepository.create(userData);
    return user;
  }
}