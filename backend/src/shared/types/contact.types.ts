// shared/types/contact.types.ts (backend y frontend)

export interface Contact {
  id: number;
  userId: number;
  contactUserId: number;
  nickname: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactWithUser extends Contact {
  user: {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
    status: 'online' | 'offline';
  };
}

export interface AddContactRequest {
  email: string;
  nickname: string;
}

export interface SearchUserResponse {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
}

export interface UpdateContactRequest {
  nickname: string;
}