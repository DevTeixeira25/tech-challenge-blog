# Vídeo da Fase 4 - funcionamento e código

**Autor:** Jefferson de Oliveira da Costa Teixeira. **Duração:** 4min54s. Gravação legendada, sem áudio.

[Abrir gravação](media/demonstracao-fase4.webm). A primeira parte demonstra o app; a segunda exibe trechos reais dos arquivos, com números de linha e explicações técnicas.

A captura funcional utiliza React Native Web com API e PostgreSQL reais. Não representa execução nativa no iPhone. O usuário confirmou apenas o acesso à API pelo Safari; o teste do aplicativo no aparelho permanece separado.

## Capítulos técnicos

| Início aproximado | Tema | Arquivo e linhas exibidas |
| --- | --- | --- |
| 01:34 | Navegação por arquivos | `mobile/src/app/_layout.tsx` (19-42) |
| 01:50 | Hooks e busca no servidor | `mobile/src/app/index.tsx` (28-53) |
| 02:10 | Sessão por plataforma | `mobile/src/lib/session.tsx` (11-34) |
| 02:30 | Integração REST e Bearer | `mobile/src/lib/api.ts` (39-69) |
| 02:54 | Permissão conferida na API | `src/middlewares/auth.middleware.ts` (16-38) |
| 03:18 | CRUD e paginação protegidos | `src/routes/people.routes.ts` (9-34) |
| 03:38 | Validação de senha em UTF-8 | `src/schemas/password.schema.ts` (1-10) |
| 03:54 | Testes que preservam os contratos | `tests/validation.compatibility.test.ts` (18-41) |

A parte funcional inclui os 17 fluxos descritos em [media/verificacao-interface.json](media/verificacao-interface.json). O vídeo final apresenta também os próximos passos para abrir no iPhone. O roteiro alternativo de 14min30s permanece disponível para apresentação narrada, se desejado.

## Data da gravação e atualização da auditoria

A gravação foi realizada em 18/11/2026 e preserva o resultado de auditoria daquele momento. Em 19/11/2026, as auditorias completas retornaram zero alertas após a retirada do advisory residual de picomatch da base oficial. Consulte [a revisão das dependências](DEPENDENCIAS.md).
