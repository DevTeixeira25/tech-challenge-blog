import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth, requireTeacher } from '../middlewares/auth.middleware';
import { createPersonSchema, peoplePaginationSchema, updatePersonSchema } from '../schemas/people.schema';
import { peopleService } from '../services/people.service';

export function createPeopleRoutes(role: Role): Router {
  const router = Router();
  router.use(requireAuth, requireTeacher);
  router.get('/', async (req, res, next) => {
    try {
      const { page, pageSize } = peoplePaginationSchema.parse(req.query);
      res.json(await peopleService.list(role, page, pageSize));
    } catch (err) { next(err); }
  });
  router.post('/', async (req, res, next) => {
    try {
      res.status(201).json(await peopleService.create(role, createPersonSchema.parse(req.body)));
    } catch (err) { next(err); }
  });
  router.get('/:id', async (req, res, next) => {
    try { res.json(await peopleService.getById(req.params.id, role)); }
    catch (err) { next(err); }
  });
  router.put('/:id', async (req, res, next) => {
    try {
      res.json(await peopleService.update(req.params.id, role, updatePersonSchema.parse(req.body)));
    } catch (err) { next(err); }
  });
  router.delete('/:id', async (req, res, next) => {
    try {
      await peopleService.remove(req.params.id, role, req.user!.id);
      res.status(204).send();
    } catch (err) { next(err); }
  });
  return router;
}
