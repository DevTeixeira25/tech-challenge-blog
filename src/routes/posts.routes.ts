import { Router } from 'express';
import { postsController } from '../controllers/posts.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// /search precisa vir antes de /:id, senao o Express trata "search"
// como se fosse um id.
router.get('/search', postsController.search);

// Leitura é pública: qualquer aluno(a) pode ver a lista e abrir um post.
router.get('/', postsController.list);
router.get('/:id', postsController.getById);

// Escrita exige docente autenticado (login em POST /auth/login).
router.post('/', requireAuth, postsController.create);
router.put('/:id', requireAuth, postsController.update);
router.delete('/:id', requireAuth, postsController.remove);

export { router as postsRoutes };
