import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth, requireTeacher } from '../middlewares/auth.middleware';

const router = Router();

// Cadastro público cria estudante; convite válido permite cadastro docente.
router.post('/login', authController.login);
router.post('/register', authController.register);

// Restritas: só quem já é docente convida outra pessoa.
router.get('/me', requireAuth, authController.me);
router.post('/invites', requireAuth, requireTeacher, authController.createInvite);
router.get('/invites', requireAuth, requireTeacher, authController.listInvites);

export { router as authRoutes };
