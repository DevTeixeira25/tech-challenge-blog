# Saber — aplicativo do blog escolar

Aplicativo React Native com Expo SDK 58, TypeScript e Expo Router. A interface em português funciona em Android, iOS e navegador. Todas as informações são obtidas da API real do repositório; não há modo demonstrativo nem dados simulados.

## Iniciar

Requisitos: Node.js 22.13 ou superior, npm e a API deste repositório em execução com banco configurado. Na pasta `mobile`:

```powershell
npm ci
Copy-Item .env.example .env
# Edite EXPO_PUBLIC_API_URL no .env antes de iniciar.
npm start
```

Abra no Expo Go compatível com SDK 58 ou em um development build. Use `npm run android`, `npm run ios` (simulador exige macOS) ou `npm run web`. Se trocar a URL, reinicie o Expo. O frontend web precisa ter sua origem autorizada no CORS da API.

A URL depende do dispositivo:

| Ambiente                     | EXPO_PUBLIC_API_URL      |
| ---------------------------- | ------------------------ |
| Navegador na máquina da API  | `http://localhost:3000`  |
| Emulador Android padrão      | `http://10.0.2.2:3000`   |
| Celular físico na mesma rede | `http://SEU_IP_LAN:3000` |

No celular, localhost aponta para o próprio aparelho. A API deve escutar em uma interface acessível à rede e a porta precisa estar liberada no firewall. Não coloque segredos em variáveis `EXPO_PUBLIC_*`. Para distribuição, utilize uma API HTTPS acessível aos dispositivos. A conexão por HTTP é voltada ao desenvolvimento local; builds nativos podem exigir configuração adicional da política de rede. Nunca crie manualmente as pastas `android/` ou `ios/` para esse ajuste.

## Usar

- Visitantes e alunos leem e buscam publicações no servidor. A busca espera 350 ms após a digitação e descarta respostas antigas. Listas permitem arrastar para atualizar.
- O login reconhece o papel da conta devolvido por `/auth/login`. Não há seletor de perfil que altere privilégios.
- Professores acessam **Gerenciar escola**: podem criar, editar e excluir publicações, professores e alunos. O autor da publicação é editável. As listas de pessoas usam paginação de 10 itens no servidor.
- **Ver e editar** carrega os dados atuais da pessoa pelo ID. A senha atual nunca é recebida nem exibida. Na edição, senha vazia preserva a senha existente; senhas novas exigem ao menos 8 caracteres e no máximo 72 bytes em UTF-8.
- Toda exclusão exibe uma confirmação explícita e só envia DELETE após **Sim, excluir**. Conflitos, como tentar excluir a própria conta de professor (409), mostram a mensagem real da API sem remover o registro da lista.
- O botão **Sair da conta** limpa a sessão. Respostas autenticadas 401 também a invalidam.

## Estrutura

`src/app` contém somente rotas e layouts do Expo Router:

- `/`: lista e busca de publicações;
- `/posts/[id]`: leitura completa;
- `/login`: autenticação de alunos e professores;
- `/admin`: painel exclusivo de professores;
- `/admin/posts` e `/admin/posts/[id]`: lista e editor de publicações;
- `/admin/people/[kind]` e `/admin/people/[kind]/[id]`: pessoas, em que kind é `teachers` ou `students`;
- `id=new` abre os formulários de criação.

`src/components/ui.tsx` concentra componentes acessíveis e o tema editorial. `src/lib/api.ts` implementa REST, timeout de 15 segundos e leitura do envelope `{ error, message, details }`. `src/lib/session.tsx` oferece contexto da sessão. O layout de gestão impede a montagem das telas internas para alunos e visitantes, inclusive por links diretos; a API também deve aplicar autorização em todas as mutações.

No Android/iOS, somente o token é persistido no SecureStore do sistema. A inicialização valida o token com `GET /auth/me`; falhas de rede permitem tentar novamente, e 401 limpa a sessão. No navegador, o token existe somente em memória e um recarregamento exige novo login. Senhas nunca são persistidas nem registradas pelo app.

## Verificar

```powershell
npm run typecheck
npm run lint
npm run export:web
npx expo-doctor
```

A exportação web verifica a construção do aplicativo; não substitui testar em um dispositivo Android/iOS. Para um build nativo, configure sua conta e projeto Expo e execute `npx eas-cli@latest build --platform android` ou `--platform ios`. Não há credenciais de distribuição, binários assinados ou configuração de conta Expo incluídos.

Para validação integrada, com a API real ligada: entre como professor, crie/edite/exclua um post e pessoas (confirmando a exclusão), navegue entre páginas, entre como aluno e tente abrir um link `/admin`, force uma sessão inválida e teste falhas de conexão/retry. As contas de teste e o banco devem ser provisionados pelo procedimento documentado no README raiz.

## Abrir no iPhone

O [guia do iPhone](../docs/TESTE_IPHONE.md) explica o teste com Expo Go SDK 58. No iPhone físico, entre na mesma conta Expo no computador (`npx expo login`) e no Expo Go. Depois execute `npx expo start --go --lan`, escaneie o QR com a Câmera e permita acesso à Rede Local. O login Expo é diferente das contas de professor e aluno do blog.

[Revisão das dependências e alerta sem patch](../docs/DEPENDENCIAS.md).
