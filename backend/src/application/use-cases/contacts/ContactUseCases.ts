// backend/src/application/use-cases/contacts/ContactUseCases.ts
import { contactRepository } from '../../../infrastructure/repositories/ContactRepository';
import type { AddContactRequest, UpdateContactRequest } from '../../../shared/types/contact.types';

export class ContactUseCases {
  // ✅ Obtener todos los contactos
  async getContacts(userId: number) {
    console.log(`📡 [ContactUseCases] getContacts(userId=${userId})`);
    return await contactRepository.getContactsByUserId(userId);
  }

  // ✅ Buscar usuario por email
  async searchUserByEmail(email: string, currentUserId: number) {
    console.log(`📧 [ContactUseCases] searchUserByEmail(email=${email}, currentUserId=${currentUserId})`);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn(`⚠️ [ContactUseCases] Formato de email inválido: ${email}`);
      throw new Error('Formato de email inválido');
    }

    const user = await contactRepository.searchUserByEmail(email, currentUserId);

    if (!user) {
      console.warn(`🔍 [ContactUseCases] Usuario con email="${email}" no encontrado (excluyendo currentUserId=${currentUserId})`);
      return null;
    }

    console.log(`✅ [ContactUseCases] Usuario encontrado: id=${(user as any).id} email=${(user as any).email}`);
    return user;
  }

  // ✅ Agregar contacto (versión corregida)
  async addContact(userId: number, data: AddContactRequest) {
    console.log(`➕ [ContactUseCases] addContact(requester=${userId}, email=${data.email})`);

    if (!data.nickname || data.nickname.trim().length === 0) {
      throw new Error('El apodo es obligatorio');
    }

    if (data.nickname.length > 100) {
      throw new Error('El apodo no puede exceder 100 caracteres');
    }

    const userToAdd = await this.searchUserByEmail(data.email, userId);

    if (!userToAdd) {
      throw new Error('Usuario no encontrado');
    }

    if (userToAdd.id === userId) {
      throw new Error('No puedes agregarte a ti mismo como contacto');
    }

    const exists = await contactRepository.contactExists(userId, userToAdd.id);
    if (exists) {
      throw new Error('Este usuario ya está en tus contactos');
    }

    // ✅ Insertar el nuevo contacto
    const created = await contactRepository.addContact(
      userId,
      userToAdd.id,
      data.nickname.trim()
    );

    console.log(`✅ [ContactUseCases] Contacto creado id=${created.id} para user=${userId}`);

    // ✅ Obtener el contacto completo (con datos del usuario relacionado)
    const allContacts = await contactRepository.getContactsByUserId(userId);
    const newContact = allContacts.find(c => c.contactUserId === userToAdd.id);

    return newContact || created;
  }

  // ✅ Actualizar apodo de contacto
  async updateContact(contactId: number, userId: number, data: UpdateContactRequest) {
    console.log(`✏️ [ContactUseCases] updateContact(contactId=${contactId}, userId=${userId})`);

    if (!data.nickname || data.nickname.trim().length === 0) {
      throw new Error('El apodo es obligatorio');
    }

    if (data.nickname.length > 100) {
      throw new Error('El apodo no puede exceder 100 caracteres');
    }

    const updated = await contactRepository.updateContactNickname(
      contactId,
      userId,
      data.nickname.trim()
    );

    if (!updated) {
      throw new Error('Contacto no encontrado');
    }

    console.log(`✅ [ContactUseCases] Contacto ${contactId} actualizado por user ${userId}`);
    return { success: true, message: 'Contacto actualizado' };
  }

  // ✅ Eliminar contacto
  async deleteContact(contactId: number, userId: number) {
    console.log(`🗑️ [ContactUseCases] deleteContact(contactId=${contactId}, userId=${userId})`);

    const deleted = await contactRepository.deleteContact(contactId, userId);

    if (!deleted) {
      throw new Error('Contacto no encontrado');
    }

    console.log(`✅ [ContactUseCases] Contacto ${contactId} eliminado por user ${userId}`);
    return { success: true, message: 'Contacto eliminado' };
  }
}

export const contactUseCases = new ContactUseCases();
