// backend/src/presentation/controllers/ContactController.ts
import { Request, Response } from 'express';
import { contactUseCases } from '../../application/use-cases/contacts/ContactUseCases';

export class ContactController {
  async getContacts(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const contacts = await contactUseCases.getContacts(userId);

      return res.json({
        success: true,
        count: contacts.length,
        data: contacts,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener contactos',
      });
    }
  }

  async searchUser(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: 'El email es obligatorio' });

      const user = await contactUseCases.searchUserByEmail(email, userId);
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

      return res.json({ success: true, data: user });
    } catch (error: any) {
      console.error('❌ Error en searchUser:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async addContact(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const { email, nickname } = req.body;
      if (!email || !nickname) return res.status(400).json({ success: false, message: 'Email y apodo son obligatorios' });

      const contact = await contactUseCases.addContact(userId, { email, nickname });
      return res.status(201).json({ success: true, message: 'Contacto agregado correctamente', data: contact });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || 'Error al agregar contacto' });
    }
  }

  async updateContact(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const contactId = parseInt(req.params.id);
      const { nickname } = req.body;
      if (!nickname) return res.status(400).json({ success: false, message: 'El apodo es obligatorio' });

      const result = await contactUseCases.updateContact(contactId, userId, { nickname });
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || 'Error al actualizar contacto' });
    }
  }

  async deleteContact(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const contactId = parseInt(req.params.id);
      const result = await contactUseCases.deleteContact(contactId, userId);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || 'Error al eliminar contacto' });
    }
  }
}

export const contactController = new ContactController();
