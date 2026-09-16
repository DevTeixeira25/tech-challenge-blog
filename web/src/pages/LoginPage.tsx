import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../components/ui/Button';
import { Field, Hint, Input, Label } from '../components/ui/Form';
import { Alert, Loading } from '../components/ui/Feedback';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/http';

const Card = styled.div`
  max-width: 420px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing(6)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  h1 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: ${({ theme }) => theme.spacing(2)};
  }

  > p {
    margin-bottom: ${({ theme }) => theme.spacing(6)};
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing(10)};
  }
`;

const Footer = styled.p`
  margin-top: ${({ theme }) => theme.spacing(6)};
  padding-top: ${({ theme }) => theme.spacing(5)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** Estado passado pela ProtectedRoute para voltar ao destino após o login. */
interface LocationState {
  from?: { pathname?: string } | string;
}

function resolveRedirect(state: unknown): string {
  const from = (state as LocationState | null)?.from;

  if (typeof from === 'string') return from;
  if (from?.pathname) return from.pathname;

  return '/admin';
}

/** Página de login dos(as) docentes. */
export function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const redirectTo = resolveRedirect(location.state);

  if (loading) {
    return <Loading label="Verificando sua sessão..." />;
  }

  // Já autenticado: não faz sentido mostrar o formulário de novo.
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login({ email: email.trim(), password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível entrar. Tente novamente.',
      );
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h1>Área do(a) docente</h1>
      <p>
        Entre para criar, editar e excluir postagens. A leitura do blog é aberta
        a todos(as).
      </p>

      {error && <Alert>{error}</Alert>}

      <form onSubmit={handleSubmit} noValidate>
        <Field>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
        </Field>

        <Field>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <Hint>
            No ambiente de desenvolvimento o seed cria ana@blog.dev com a senha
            senha123.
          </Hint>
        </Field>

        <Button type="submit" $fullWidth disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <Footer>
        Recebeu um convite? <Link to="/cadastro">Criar conta</Link>
      </Footer>
    </Card>
  );
}
