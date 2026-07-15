/** Especificação OpenAPI 3.0 da API de blogging. Servida em /docs. */
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'API de Blogging — Tech Challenge FIAP',
    version: '1.0.0',
    description:
      'API REST para postagens de docentes da rede pública de educação.',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [{ name: 'Posts', description: 'Gerenciamento de postagens' }],
  components: {
    schemas: {
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Introdução à fotossíntese' },
          content: { type: 'string', example: 'A fotossíntese é...' },
          author: { type: 'string', example: 'Prof. Carlos Lima' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PostInput: {
        type: 'object',
        required: ['title', 'content', 'author'],
        properties: {
          title: { type: 'string', example: 'Introdução à fotossíntese' },
          content: { type: 'string', example: 'A fotossíntese é...' },
          author: { type: 'string', example: 'Prof. Carlos Lima' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/posts': {
      get: {
        tags: ['Posts'],
        summary: 'Lista todos os posts',
        responses: {
          200: {
            description: 'Lista de posts',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Post' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Posts'],
        summary: 'Cria uma nova postagem',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PostInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Post criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          400: {
            description: 'Dados inválidos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/search': {
      get: {
        tags: ['Posts'],
        summary: 'Busca posts por palavra-chave (título ou conteúdo)',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Termo de busca',
          },
        ],
        responses: {
          200: {
            description: 'Posts encontrados',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Post' },
                },
              },
            },
          },
          400: { description: 'Query "q" ausente ou vazia' },
        },
      },
    },
    '/posts/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      get: {
        tags: ['Posts'],
        summary: 'Lê um post pelo id',
        responses: {
          200: {
            description: 'Post encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          404: { description: 'Post não encontrado' },
        },
      },
      put: {
        tags: ['Posts'],
        summary: 'Edita um post existente',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PostInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Post atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          404: { description: 'Post não encontrado' },
        },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Exclui um post',
        responses: {
          204: { description: 'Post excluído (sem conteúdo)' },
          404: { description: 'Post não encontrado' },
        },
      },
    },
  },
} as const;
