// backend/src/shared/types/user.types.ts

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away'
}

export interface IUser {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url: string | null;
  status: UserStatus;
  about: string;
  created_at: Date;
  updated_at: Date;
  last_seen: Date | null;
}

export interface IUserPublic {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  status: UserStatus;
  about: string;
  last_seen: Date | null;
}