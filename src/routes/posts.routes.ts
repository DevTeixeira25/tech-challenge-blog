import { Router } from 'express';
import { postsController } from '../controllers/posts.controller';
import { requireAuth, requireTeacher } from '../middlewares/auth.middleware';

const router = Router();

// /search precisa vir antes de /:id, senao o Express trata "search"
// como se fosse um id.
router.get('/search', postsController.search);

// Leitura é pública: qualquer aluno(a) pode ver a lista e abrir um post.
router.get('/', postsController.list);
router.get('/:id', postsController.getById);

// Escrita exige docente autenticado (login em POST /auth/login).
router.post('/', requireAuth, requireTeacher, postsController.create);
router.put('/:id', requireAuth, requireTeacher, postsController.update);
router.delete('/:id', requireAuth, requireTeacher, postsController.remove);

export { router as postsRoutes };
