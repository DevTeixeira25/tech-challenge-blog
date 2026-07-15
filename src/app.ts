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

  // Rota raiz — apresenta a API e aponta para a documentação
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'API de Blogging — Tech Challenge FIAP',
      version: '1.0.0',
      docs: '/docs',
      health: '/health',
      endpoints: {
        'GET /posts': 'Lista todos os posts',
        'GET /posts/search?q=': 'Busca posts por palavra-chave',
        'GET /posts/:id': 'Lê um post',
        'POST /posts': 'Cria um post',
        'PUT /posts/:id': 'Edita um post',
        'DELETE /posts/:id': 'Exclui um post',
      },
    });
  });

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
