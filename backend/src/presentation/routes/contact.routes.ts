// backend/src/presentation/routes/contact.routes.ts
import { Router } from 'express';
import { contactController } from '../controllers/ContactController';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use((req, res, next) => {
  console.log(`🧭 Middleware contact.routes: ${req.method} ${req.originalUrl}`);
  next();
});

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/contacts - Obtener todos los contactos
router.get('/', (req, res) => {
  console.log('📞 Ruta GET /api/contacts');
  contactController.getContacts(req, res);
});

// POST /api/contacts/search - Buscar usuario por email
router.post('/search', (req, res) => {
  console.log('🔍 Ruta POST /api/contacts/search');
  contactController.searchUser(req, res);
});

// POST /api/contacts - Agregar contacto
router.post('/', (req, res) => {
  console.log('➕ Ruta POST /api/contacts');
  contactController.addContact(req, res);
});

// PUT /api/contacts/:id - Actualizar apodo
router.put('/:id', (req, res) => {
  console.log('✏️ Ruta PUT /api/contacts/:id');
  contactController.updateContact(req, res);
});

// DELETE /api/contacts/:id - Eliminar contacto
router.delete('/:id', (req, res) => {
  console.log('🗑️ Ruta DELETE /api/contacts/:id');
  contactController.deleteContact(req, res);
});

export default router;
