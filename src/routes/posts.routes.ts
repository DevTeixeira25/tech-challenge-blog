import { Router } from 'express';
import { postsController } from '../controllers/posts.controller';

const router = Router();

// /search precisa vir antes de /:id, senao o Express trata "search"
// como se fosse um id.
router.get('/search', postsController.search);

router.get('/', postsController.list);
router.get('/:id', postsController.getById);
router.post('/', postsController.create);
router.put('/:id', postsController.update);
router.delete('/:id', postsController.remove);

export { router as postsRoutes };
