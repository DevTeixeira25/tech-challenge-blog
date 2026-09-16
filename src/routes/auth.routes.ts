import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Públicas: entrar e cadastrar-se (o cadastro exige um código de convite).
router.post('/login', authController.login);
router.post('/register', authController.register);

// Restritas: só quem já é docente convida outra pessoa.
router.get('/me', requireAuth, authController.me);
router.post('/invites', requireAuth, authController.createInvite);
router.get('/invites', requireAuth, authController.listInvites);

export { router as authRoutes };
