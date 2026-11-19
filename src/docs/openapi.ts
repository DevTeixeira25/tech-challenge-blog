/** Operações administrativas com perfil fixo conforme a rota. */
function personPaths(path: string, label: string) {
  const security = [{ bearerAuth: [] }];
  const content = (schema: string) => ({ 'application/json': { schema: { $ref: `#/components/schemas/${schema}` } } });
  const errors = {
    400: { description: 'Dados inválidos; role não é aceito no corpo' },
    401: { description: 'Token ausente/inválido ou usuário removido' },
    403: { description: 'Somente docentes podem gerenciar pessoas' },
  };
  return {
    [path]: {
      get: {
        tags: ['People'], summary: `Lista ${label} com paginação`, security,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 1000000, default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
        ],
        responses: { 200: { description: 'Página de pessoas sem hashes de senha', content: content('PeoplePage') }, ...errors },
      },
      post: {
        tags: ['People'], summary: `Cria conta de ${label}`, security,
        requestBody: { required: true, content: content('PersonInput') },
        responses: { 201: { description: 'Pessoa criada', content: content('User') }, 409: { description: 'E-mail já cadastrado' }, ...errors },
      },
    },
    [`${path}/{id}`]: {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['People'], summary: `Consulta conta de ${label}`, security,
        responses: { 200: { description: 'Pessoa encontrada', content: content('User') }, 404: { description: 'Pessoa não encontrada neste perfil' }, ...errors },
      },
      put: {
        tags: ['People'], summary: `Atualiza conta de ${label}`, security,
        requestBody: { required: true, content: content('PersonUpdate') },
        responses: { 200: { description: 'Pessoa atualizada', content: content('User') }, 404: { description: 'Pessoa não encontrada neste perfil' }, 409: { description: 'E-mail já cadastrado' }, ...errors },
      },
      delete: {
        tags: ['People'], summary: `Exclui conta de ${label}`, security,
        responses: { 204: { description: 'Pessoa excluída' }, 404: { description: 'Pessoa não encontrada neste perfil' }, 409: { description: 'Docente não pode excluir a própria conta nem deixar a escola sem docentes' }, ...errors },
      },
    },
  };
}
const peoplePaths = { ...personPaths('/teachers', 'docentes'), ...personPaths('/students', 'estudantes') };

/** Especificação OpenAPI 3.0 da API de blogging. Servida em /docs. */
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'API de Blogging — Tech Challenge FIAP',
    version: '4.0.0',
    description:
      'API REST para postagens de docentes da rede pública de educação. ' +
      'A leitura é pública; criar, editar e excluir exige o token JWT ' +
      'obtido em POST /auth/login e perfil TEACHER atual no banco. Estudantes consultam posts.',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Auth', description: 'Autenticação de docentes e estudantes' },
    { name: 'People', description: 'Gestão de docentes e estudantes (somente TEACHER)' },
    { name: 'Posts', description: 'Gerenciamento de postagens' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token devolvido por POST /auth/login',
      },
    },
    schemas: {
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Introdução à fotossíntese' },
          content: {
            type: 'string',
            example: 'A fotossíntese converte luz solar em energia...',
          },
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
          content: {
            type: 'string',
            example: 'A fotossíntese converte luz solar em energia.',
          },
          author: { type: 'string', example: 'Prof. Carlos Lima' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'ana@blog.dev' },
          password: { type: 'string', format: 'password', example: 'senha123' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Prof. Ana Souza' },
          role: { type: 'string', enum: ['TEACHER', 'STUDENT'] },
          email: { type: 'string', format: 'email', example: 'ana@blog.dev' },
        },
      },
      PersonInput: {
        type: 'object', additionalProperties: false,
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 120 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password', minLength: 8, maxLength: 72, description: 'Máximo de 72 bytes em UTF-8' },
        },
      },
      PersonUpdate: {
        type: 'object', additionalProperties: false, minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 120 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password', minLength: 8, maxLength: 72, description: 'Máximo de 72 bytes em UTF-8' },
        },
      },
      PeoplePage: {
        type: 'object', required: ['items', 'page', 'pageSize', 'total', 'totalPages'],
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          page: { type: 'integer' }, pageSize: { type: 'integer' },
          total: { type: 'integer' }, totalPages: { type: 'integer' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Prof. Joana Reis' },
          email: { type: 'string', format: 'email', example: 'joana@blog.dev' },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            maxLength: 72,
            description: 'Máximo de 72 bytes em UTF-8',
            example: 'minhasenhaforte',
          },
          code: {
            type: 'string',
            description:
              'Opcional. Código de convite, quando a pessoa recebeu um: ' +
              'o convite válido cria TEACHER e é consumido. Sem código cria STUDENT.',
            example: 'K7HQ-3MTP-XB29',
          },
        },
      },
      CreateInviteInput: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description:
              'Opcional. Quando informado, só esse e-mail pode usar o convite.',
            example: 'joana@blog.dev',
          },
          expiresInDays: {
            type: 'integer',
            minimum: 1,
            maximum: 90,
            default: 7,
            description: 'Validade do convite em dias',
          },
        },
      },
      Invite: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'K7HQ-3MTP-XB29' },
          email: { type: 'string', nullable: true, example: null },
          expiresAt: { type: 'string', format: 'date-time' },
          usedAt: { type: 'string', format: 'date-time', nullable: true },
          status: {
            type: 'string',
            enum: ['ativo', 'usado', 'expirado'],
            example: 'ativo',
          },
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
    responses: {
      Unauthorized: {
        description: 'Token ausente, inválido ou expirado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  },
  paths: {
    ...peoplePaths,
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Autentica docente ou estudante e devolve token e perfil',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login realizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
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
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { description: 'Perfil sem permissão para esta operação' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Cadastra estudante ou docente convidado',
        description:
          'Sem convite, cria STUDENT. Um convite válido cria TEACHER e é consumido. ' +
          'O cliente não pode escolher o perfil. ' +
          'Em caso de sucesso já devolve o token, então quem se cadastra ' +
          'entra direto.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Pessoa cadastrada e autenticada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          400: {
            description:
              'Dados inválidos, ou código informado inexistente/usado/expirado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          409: {
            description: 'Já existe uma conta com este e-mail',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/invites': {
      post: {
        tags: ['Auth'],
        summary: 'Gera um convite para um(a) novo(a) docente',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateInviteInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Convite criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Invite' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { description: 'Perfil sem permissão para esta operação' },
        },
      },
      get: {
        tags: ['Auth'],
        summary: 'Lista os convites gerados (mais recentes primeiro)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Convites',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Invite' },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { description: 'Perfil sem permissão para esta operação' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Perfil atual da pessoa autenticada, incluindo role',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Perfil atual no banco',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { description: 'Perfil sem permissão para esta operação' },
        },
      },
    },
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
        security: [{ bearerAuth: [] }],
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
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { description: 'Perfil sem permissão para esta operação' },
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
        security: [{ bearerAuth: [] }],
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
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { description: 'Perfil sem permissão para esta operação' },
          404: { description: 'Post não encontrado' },
        },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Exclui um post',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Post excluído (sem conteúdo)' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { description: 'Perfil sem permissão para esta operação' },
          404: { description: 'Post não encontrado' },
        },
      },
    },
  },
} as const;
