# Testar o aplicativo no iPhone — mesma rede Wi-Fi

Guia preparado para o computador Windows deste projeto, em 18/11/2026. Jefferson confirmou que o Safari do iPhone abre `http://192.168.18.21:3300/health` e recebe `status: ok`. Isso confirma o acesso do telefone à API; o aplicativo ainda precisa ser aberto e testado no aparelho.

## 1. Preparar o iPhone

Instale ou atualize o [Expo Go na App Store](https://apps.apple.com/br/app/expo-go/id982107779). A versão consultada foi 58.0.5, com suporte ao SDK 58 do projeto e exigência de iOS 16.4 ou superior. Para testar por esse caminho, não é necessário Mac nem Xcode.

Mantenha iPhone e computador na mesma rede Wi-Fi, sem usar a rede de convidados. No Expo Go, entre com sua **conta Expo**. Ela é diferente das contas de professor e aluno do blog.

## 2. Entrar na mesma conta Expo no computador

O Expo CLI estava sem login na preparação deste guia. Abra um terminal na pasta do aplicativo e execute:

```powershell
Set-Location 'C:\Users\ADMINISTRATOR\Documents\Codex\2026-11-18\ut\work\tech-challenge-blog\mobile'
npx expo login
npx expo whoami
```

Faça o login diretamente nesse terminal e confira o nome retornado por `whoami`. Use a mesma conta que entrou no Expo Go do iPhone. Não envie sua senha no chat. No iPhone físico, a [orientação oficial do Expo](https://docs.expo.dev/get-started/start-developing/) exige a mesma conta nos dois lugares.

## 3. Abrir o aplicativo pelo QR Code

1. Confirme novamente no Safari: `http://192.168.18.21:3300/health` deve responder com `status: ok`.
2. No computador, abra o arquivo `iniciar-teste-iphone.cmd`, na pasta `outputs` da entrega. Mantenha a janela aberta.
3. Espere o QR Code aparecer no terminal. Abra a **Câmera do iPhone**, aponte para ele e toque no aviso para abrir no Expo Go.
4. Quando o iPhone pedir, permita que o Expo Go acesse a **Rede Local**. Aguarde o carregamento do projeto.

O atalho é específico deste computador e inicia o Expo na pasta do aplicativo, usando a API `http://192.168.18.21:3300` e conexão LAN, com limpeza do cache. Ele não inicia a API. Depois de reiniciar o computador, a API também precisa estar em execução antes do teste.

Para referência, o atalho configura e executa:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://192.168.18.21:3300'
npx expo start --go --lan --clear
```

Não use `localhost` como endereço da API no iPhone: ele aponta para o próprio telefone. Os endereços com porta 3000 nos exemplos gerais do projeto não são o endereço deste teste, que utiliza **3300**.

## 4. Entrar no blog

Depois que o aplicativo abrir, o login escolar é outro:

| Perfil no blog | E-mail | Senha de demonstração |
| --- | --- | --- |
| Professor | `ana@blog.dev` | `senha123` |
| Aluno | `aluno@blog.dev` | `aluno1234` |

A conta Expo abre o projeto no Expo Go. A conta escolar determina o que você pode fazer dentro do aplicativo. Não informe as credenciais escolares no comando `expo login`.

## 5. Roteiro de teste no aparelho

Use registros criados para o teste ao excluir. Para novos professores/alunos, use e-mails ainda não cadastrados e senha com pelo menos 8 caracteres, por exemplo `Teste1234`.

- [ ] **Lista e busca:** veja título, autor e descrição breve dos posts. Busque uma palavra, confira o resultado e limpe a busca.
- [ ] **Leitura:** abra uma publicação e confira o conteúdo completo. Volte à lista.
- [ ] **Professor:** entre com `ana@blog.dev` e abra **Gerenciar escola**.
- [ ] **Publicações:** crie um post de teste com título, conteúdo e autor. Abra sua leitura. Edite, confira os valores preenchidos e salve. Exclua esse post, conferindo o pedido de confirmação.
- [ ] **Professores:** navegue entre as páginas; crie uma conta de teste, abra **Ver e editar**, altere o nome e salve. Deixe a nova senha em branco para conservar a anterior. Exclua somente a conta recém-criada, confirmando a ação.
- [ ] **Alunos:** repita cadastro, consulta, edição e exclusão com um aluno de teste. Confira os botões de paginação e a mudança dos registros exibidos.
- [ ] **Persistência da sessão:** ainda conectado como professor, feche completamente o Expo Go e reabra o mesmo projeto. Com a API disponível, confira se a conta continua reconhecida. O aplicativo nativo guarda o token com SecureStore e valida a sessão ao abrir.
- [ ] **Sair da conta:** toque em **Sair da conta**. Confira que a área de gestão não continua disponível, inclusive após fechar e reabrir o projeto.
- [ ] **Aluno:** entre com `aluno@blog.dev`. Confira lista, busca e leitura, sem opções de criar, editar ou excluir; a gestão deve permanecer restrita.
- [ ] **Perda de rede:** desligue temporariamente o Wi-Fi do iPhone e tente atualizar ou abrir uma tela que busca dados. Confira a mensagem de falha. Reconecte à mesma rede e tente novamente ou reabra a tela. Uma falha de rede não deve ser apresentada como salvamento concluído.

Registre o modelo do iPhone, a versão do iOS, data, etapas que passaram e qualquer mensagem de erro. Este checklist só deve ser marcado depois da execução real no aparelho.

## Se algo não abrir

| O que acontece | O que conferir |
| --- | --- |
| O Safari não abre `/health` | Confirme se a API está ligada na porta 3300, se o computador mantém o mesmo IP e se ambos estão na mesma rede. O atalho do Expo não resolve uma API desligada. |
| `/health` funciona, mas o QR Code não abre o projeto | Confira a mesma conta Expo no terminal e no Expo Go, use a Câmera para ler o QR atual e mantenha o terminal aberto. |
| Há aviso sobre conta Expo | No computador, confira `npx expo whoami`; no Expo Go, confira a conta no ícone de perfil. Entre na mesma conta nos dois e tente novamente. |
| Expo Go não acessa o computador | No iPhone, procure **Ajustes → Privacidade e Segurança → Rede Local** e permita Expo Go. Confira também VPN e isolamento da rede de convidados no roteador. |
| O aplicativo abre, mas a lista falha | Confirme `/health` e o endereço da API usado ao iniciar o Expo. O teste usa `192.168.18.21:3300`; reinicie o Expo ao mudar a configuração. |
| Aparece incompatibilidade de SDK | Atualize o Expo Go; este projeto usa SDK 58. Confira também se o iOS atende ao mínimo indicado na App Store. |
| O computador mudou de rede ou reiniciou | Execute `ipconfig` no Windows e confira o IPv4 do adaptador Wi-Fi. Se mudou, atualize a URL da API no atalho e reinicie o Expo para gerar um QR atual. Confirme que a API voltou a executar. |

Usar um túnel no Expo pode ajudar o telefone a alcançar o servidor que entrega o aplicativo, mas **não publica a API local**. A API configurada em `192.168.18.21:3300` continua precisando estar acessível ao iPhone. Este guia mantém a conexão pela mesma Wi-Fi.

## Referências verificadas

- [Expo Go — versão e requisitos na App Store](https://apps.apple.com/br/app/expo-go/id982107779).
- [Expo — iniciar o servidor e abrir no dispositivo](https://docs.expo.dev/get-started/start-developing/).
