// backend/src/application/use-cases/auth/LogoutUser.usecase.ts
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserStatus } from '../../../shared/types/user.types';

export class LogoutUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: number): Promise<void> {
    await this.userRepository.updateStatus(userId, UserStatus.OFFLINE);
    await this.userRepository.updateLastSeen(userId);
  }
}