# Dependências - atualização de 19/11/2026

## Resultado atual

Em **19/11/2026**, `npm audit` retornou **zero vulnerabilidades reportadas** nas três pastas: API, mobile e web, incluindo dependências de desenvolvimento. Os relatórios completos atuais estão em `docs/auditorias/api.json`, `mobile.json` e `web.json`.

As correções de código foram aplicadas e verificadas. O alerta residual de picomatch desapareceu porque o advisory foi **retirado da base oficial em 18/11/2026**. Não foi publicada uma versão corrigida do pacote: a versão consultada continuava sendo 4.0.7. Essa retirada foi registrada separadamente das atualizações do projeto. [Advisory oficial GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf).

A ausência de alertas no npm é o resultado da auditoria consultada, não uma certificação geral de segurança.

## Correções aplicadas

- **API:** Express 4.22.3, qs 6.16.2 e Zod 4.6.7. A migração controlada do Zod preserva HTTP 400 e o mapa de mensagens por campo. Quatro testes de compatibilidade foram acrescentados aos 77 anteriores: **81 testes em 7 suítes aprovados**. Jest 29 foi preservado.
- **Mobile:** minimatch 11.0.9 aplicado somente a `@expo/fingerprint`, com verificação das APIs utilizadas e geração real de fingerprint. SDK 58 e versões suportadas de React/React Native preservados.
- **Web:** atualização compatível para Vite 8.3.8, typescript-eslint 8.73.0, source-map-js 1.2.2 e demais dependências resolvidas no lockfile. Eliminados os avisos de Vite/launch-editor, brace-expansion, minimatch, source-map-js e Zod.
- **CI:** auditoria completa, incluindo desenvolvimento, passou a ser obrigatória nas três frentes. Nenhum alerta foi ocultado ou ignorado por configuração.

## Histórico verificável

| Projeto | Antes das correções em 18/11 | Após as correções em 18/11 | Auditoria em 19/11 |
| --- | --- | --- | --- |
| API | 46 (44 altos, 2 moderados) | 43 altos, derivados de picomatch | 0 |
| Mobile | 42 (40 altos, 2 moderados) | 40 altos, derivados de picomatch | 0 |
| Web | 14 (8 altos, 6 moderados) | 11 altos, derivados de picomatch | 0 |

Os 43/40/11 apontamentos observados em 18/11 eram efeitos transitivos de uma única causa. O npm também atribui o risco aos pacotes dependentes. Os JSON daquele momento foram preservados em `docs/auditorias/2026-11-18/`, e os relatórios atuais estão no diretório pai. A documentação e a gravação de 18/11 refletem a sequência real dessa revisão.

Não foram usados downgrade automático de Expo/Vite/Jest, renumeração artificial de pacotes nem supressão da auditoria. O override de minimatch foi restrito ao componente do Expo cujo uso foi verificado.

## Verificações executadas

- API: instalação limpa, geração do Prisma, build, lint e 81 testes aprovados.
- Mobile: instalação limpa, typecheck, lint, exportação web, exportação iOS/Hermes, Expo Doctor 20/20, seis verificações de compatibilidade de minimatch e fingerprint real. A exportação iOS não equivale a executar no iPhone.
- Web: build e lint aprovados.
- Auditoria completa: zero alertas na API, mobile e web em 19/11/2026.
- Seed compilado com as mesmas opções do Docker e executado com sucesso; guia corrigido para `node dist/prisma/seed.js`.

## Repetir

Execute `npm audit` nas três pastas. A API e a web também oferecem `npm run audit:prod` para consultar apenas produção. O CI exige aprovação da auditoria completa nas três frentes, sem supressão de avisos.
