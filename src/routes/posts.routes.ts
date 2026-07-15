import { Router } from 'express';
import { postsController } from '../controllers/posts.controller';

const router = Router();

// ATENÇÃO: /search precisa vir ANTES de /:id, senão o Express
// interpreta "search" como um valor de :id.
router.get('/search', postsController.search);

router.get('/', postsController.list);
router.get('/:id', postsController.getById);
router.post('/', postsController.create);
router.put('/:id', postsController.update);
router.delete('/:id', postsController.remove);

export { router as postsRoutes };
