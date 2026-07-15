import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { postsRoutes } from './routes/posts.routes';
import { openapiSpec } from './docs/openapi';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

/**
 * Cria e configura a aplicação Express.
 * Separado do server.ts para poder ser importado nos testes (Supertest)
 * sem abrir uma porta.
 */
export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Healthcheck (usado pelo Docker/CI)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Documentação interativa
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // Rotas de posts
  app.use('/posts', postsRoutes);

  // 404 e tratamento central de erros (sempre por último)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
