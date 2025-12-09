// backend/src/infrastructure/repositories/ContactRepository.ts
import { database } from '../database/mysql/connection';
import type { Contact, ContactWithUser } from '../../shared/types/contact.types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// Interfaces internas para filas
interface ContactRow extends RowDataPacket {
  contact_id: number;
  contact_user_id: number;
  nickname: string;
  created_at: string;
  updated_at: string;
  username: string;
  email: string;
  avatar_url: string | null;
  status: 'online' | 'offline';
}

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
}

interface CountRow extends RowDataPacket {
  count: number;
}

export class ContactRepository {
  // ✅ Obtener todos los contactos con datos del usuario
  async getContactsByUserId(userId: number): Promise<ContactWithUser[]> {
    console.log(`📡 [ContactRepository] getContactsByUserId(${userId})`);
    const query = `
      SELECT 
        c.id AS contact_id,
        c.user_id,
        c.contact_user_id,
        c.nickname,
        c.created_at,
        c.updated_at,
        u.username,
        u.email,
        u.avatar_url,
        u.status
      FROM contacts c
      INNER JOIN users u ON c.contact_user_id = u.id
      WHERE c.user_id = ?
      ORDER BY c.nickname ASC
    `;

    try {
      const result: any = await database.query<ContactRow[]>(query, [userId]);
      const rows = Array.isArray(result[0]) ? result[0] : result;

      if (!Array.isArray(rows) || rows.length === 0) {
        console.log(`ℹ️ [INFO] El usuario ${userId} no tiene contactos registrados.`);
        return [];
      }

      console.log(`✅ [DB] ${rows.length} contactos encontrados para userId=${userId}`);

      return rows.map((row: ContactRow) => ({
        id: row.contact_id,
        userId: userId,
        contactUserId: row.contact_user_id,
        nickname: row.nickname,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user: {
          id: row.contact_user_id,
          username: row.username,
          email: row.email,
          avatarUrl: row.avatar_url,
          status: row.status,
        },
      }));
    } catch (error) {
      console.error('❌ [DB ERROR] getContactsByUserId:', error);
      throw error;
    }
  }

  // ✅ Buscar un contacto específico
  async getContactByUserAndContactId(userId: number, contactUserId: number): Promise<Contact | null> {
    console.log(`🔍 [ContactRepository] getContactByUserAndContactId(${userId}, ${contactUserId})`);
    const query = `
      SELECT 
        id, user_id as userId, contact_user_id as contactUserId, 
        nickname, created_at as createdAt, updated_at as updatedAt
      FROM contacts
      WHERE user_id = ? AND contact_user_id = ?
    `;

    try {
      const result: any = await database.query<RowDataPacket[]>(query, [userId, contactUserId]);
      const rows = Array.isArray(result[0]) ? result[0] : result;
      return rows && rows.length > 0 ? (rows[0] as Contact) : null;
    } catch (error) {
      console.error('❌ [DB ERROR] getContactByUserAndContactId:', error);
      throw error;
    }
  }

  // ✅ Agregar contacto (corregido)
  async addContact(userId: number, contactUserId: number, nickname: string): Promise<Contact> {
    console.log(`➕ [ContactRepository] addContact(${userId}, ${contactUserId}, "${nickname}")`);
    const query = `
      INSERT INTO contacts (user_id, contact_user_id, nickname)
      VALUES (?, ?, ?)
    `;

    try {
      const result: any = await database.query<ResultSetHeader>(query, [userId, contactUserId, nickname]);
      const data = Array.isArray(result) ? result[0] : result;

      console.log(`✅ [DB] Contacto insertado con ID: ${data.insertId}`);

      return {
        id: data.insertId,
        userId,
        contactUserId,
        nickname,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ [DB ERROR] addContact:', error);
      throw error;
    }
  }

  // ✅ Actualizar apodo
  async updateContactNickname(contactId: number, userId: number, nickname: string): Promise<boolean> {
    const query = `
      UPDATE contacts 
      SET nickname = ?
      WHERE id = ? AND user_id = ?
    `;
    try {
      const result: any = await database.query<ResultSetHeader>(query, [nickname, contactId, userId]);
      const data = Array.isArray(result) ? result[0] : result;
      return data.affectedRows > 0;
    } catch (error) {
      console.error('❌ [DB ERROR] updateContactNickname:', error);
      throw error;
    }
  }

  // ✅ Eliminar contacto
  async deleteContact(contactId: number, userId: number): Promise<boolean> {
    const query = `
      DELETE FROM contacts 
      WHERE id = ? AND user_id = ?
    `;
    try {
      const result: any = await database.query<ResultSetHeader>(query, [contactId, userId]);
      const data = Array.isArray(result) ? result[0] : result;
      return data.affectedRows > 0;
    } catch (error) {
      console.error('❌ [DB ERROR] deleteContact:', error);
      throw error;
    }
  }

  // ✅ Verificar si ya existe
  async contactExists(userId: number, contactUserId: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM contacts
      WHERE user_id = ? AND contact_user_id = ?
    `;
    try {
      const result: any = await database.query<CountRow[]>(query, [userId, contactUserId]);
      const rows = Array.isArray(result[0]) ? result[0] : result;
      const count = rows?.[0]?.count ?? 0;
      return count > 0;
    } catch (error) {
      console.error('❌ [DB ERROR] contactExists:', error);
      throw error;
    }
  }

  // ✅ Buscar usuario por email
  async searchUserByEmail(email: string, currentUserId: number) {
    const query = `
      SELECT id, username, email, avatar_url AS avatarUrl
      FROM users
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
    `;
    try {
      const result: any = await database.query<UserRow[]>(query, [email.trim().toLowerCase()]);
      const rows = Array.isArray(result[0]) ? result[0] : result;
      const user = rows?.[0];
      if (!user) return null;
      if (user.id === currentUserId) return null;
      return user;
    } catch (error) {
      console.error('❌ [DB ERROR] searchUserByEmail:', error);
      throw error;
    }
  }
}

export const contactRepository = new ContactRepository();
