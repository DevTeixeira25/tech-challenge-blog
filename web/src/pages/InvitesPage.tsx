import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../components/ui/Button';
import { Field, Hint, Input, Label } from '../components/ui/Form';
import { Alert, EmptyState, Loading } from '../components/ui/Feedback';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { authService } from '../services/auth.service';
import { ApiError } from '../services/http';
import type { Invite } from '../types';
import { formatDate } from '../utils/format';

const Head = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(8)};

  h1 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: ${({ theme }) => theme.spacing(2)};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Panel = styled.section`
  padding: ${({ theme }) => theme.spacing(5)};
  margin-bottom: ${({ theme }) => theme.spacing(8)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.md};
    margin-bottom: ${({ theme }) => theme.spacing(4)};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing(6)};
  }
`;

/** Destaque do convite recém-criado, com o código e o link prontos. */
const NewInvite = styled.div`
  margin-top: ${({ theme }) => theme.spacing(5)};
  padding: ${({ theme }) => theme.spacing(4)};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.primaryLight};

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    letter-spacing: 0.08em;
    margin-bottom: ${({ theme }) => theme.spacing(2)};
  }

  code {
    display: block;
    overflow-wrap: anywhere;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    margin-bottom: ${({ theme }) => theme.spacing(4)};
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

const Row = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(4)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.surface};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const Code = styled.span`
  font-family: 'Consolas', 'Courier New', monospace;
  letter-spacing: 0.08em;
  font-weight: 600;
`;

const Status = styled.span<{ $status: Invite['status'] }>`
  align-self: flex-start;
  padding: ${({ theme }) => `${theme.spacing(0.5)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  background-color: ${({ theme, $status }) =>
    $status === 'ativo'
      ? theme.colors.success
      : $status === 'usado'
        ? theme.colors.textMuted
        : theme.colors.danger};
`;

const Meta = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

/** Monta o link de cadastro que o convite acompanha. */
function registrationLink(code: string): string {
  return `${window.location.origin}/cadastro?convite=${code}`;
}

/**
 * Página de convites: é aqui que um(a) docente dá acesso a quem ainda não
 * tem conta. Não existe cadastro aberto no blog.
 */
export function InvitesPage() {
  const [email, setEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Invite | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchInvites = useCallback(
    (signal: AbortSignal) => authService.listInvites(signal),
    [],
  );

  const {
    data: invites,
    error: loadError,
    loading,
    reload,
  } = useAsyncResource<Invite[]>('invites', fetchInvites, (err) =>
    err instanceof ApiError
      ? err.message
      : 'Não foi possível carregar os convites.',
  );

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCopied(false);

    try {
      const invite = await authService.createInvite({
        email: email.trim() || undefined,
        expiresInDays: Number(expiresInDays),
      });
      setCreated(invite);
      setEmail('');
      reload();
    } catch (err) {
      setCreateError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível gerar o convite.',
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(registrationLink(code));
      setCopied(true);
    } catch {
      // Sem permissão de área de transferência: o link continua visível
      // na tela para ser copiado à mão.
      setCopied(false);
    }
  }

  return (
    <>
      <Head>
        <h1>Convites</h1>
        <p>
          Quem ainda não tem conta entra por convite. Gere um código, envie para
          a pessoa e ela cria a própria senha.
        </p>
      </Head>

      <Panel>
        <h2>Gerar novo convite</h2>

        {createError && <Alert>{createError}</Alert>}

        <form onSubmit={handleCreate}>
          <Field>
            <Label htmlFor="convite-email">E-mail da pessoa (opcional)</Label>
            <Input
              id="convite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="colega@escola.edu.br"
              aria-describedby="dica-email"
              autoComplete="off"
            />
            <Hint id="dica-email">
              Se preenchido, só esse e-mail conseguirá usar o convite.
            </Hint>
          </Field>

          <Field>
            <Label htmlFor="convite-validade">Validade (dias)</Label>
            <Input
              id="convite-validade"
              type="number"
              min={1}
              max={90}
              value={expiresInDays}
              onChange={(event) => setExpiresInDays(event.target.value)}
            />
          </Field>

          <Button type="submit" disabled={creating}>
            {creating ? 'Gerando...' : 'Gerar convite'}
          </Button>
        </form>

        {created && (
          <NewInvite>
            <strong>{created.code}</strong>
            <code>{registrationLink(created.code)}</code>
            <Button
              type="button"
              $variant="secondary"
              onClick={() => handleCopy(created.code)}
            >
              {copied ? 'Link copiado!' : 'Copiar link de cadastro'}
            </Button>
            <p aria-live="polite">
              <Meta>
                Válido até {formatDate(created.expiresAt)}. Vale uma única vez.
              </Meta>
            </p>
          </NewInvite>
        )}
      </Panel>

      <h2>Convites gerados</h2>

      {loadError && <Alert>{loadError}</Alert>}
      {loading && <Loading label="Carregando convites..." />}

      {!loading && !loadError && invites?.length === 0 && (
        <EmptyState
          title="Nenhum convite ainda"
          description="Gere o primeiro convite no formulário acima."
        />
      )}

      {!loading && invites && invites.length > 0 && (
        <List>
          {invites.map((invite) => (
            <Row key={invite.id}>
              <div>
                <Code>{invite.code}</Code>
                <br />
                <Meta>
                  {invite.email ? `Para ${invite.email} · ` : ''}
                  {invite.usedAt
                    ? `Usado em ${formatDate(invite.usedAt)}`
                    : `Válido até ${formatDate(invite.expiresAt)}`}
                </Meta>
              </div>

              <Status $status={invite.status}>{invite.status}</Status>
            </Row>
          ))}
        </List>
      )}
    </>
  );
}
