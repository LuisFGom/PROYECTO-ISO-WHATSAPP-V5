// backend/src/domain/entities/User.entity.ts
import { UserStatus } from '../../shared/types/user.types';

export class User {
  constructor(
    public id: number,
    public username: string,
    public email: string,
    public passwordHash: string,
    public avatarUrl: string | null = null,
    public status: UserStatus = UserStatus.OFFLINE,
    public about: string = 'Hey there! I am using WhatsApp Clone',
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public lastSeen: Date | null = null
  ) {}

  public toPublic() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      avatarUrl: this.avatarUrl,
      status: this.status,
      about: this.about,
      lastSeen: this.lastSeen,
    };
  }

  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    return usernameRegex.test(username);
  }
}