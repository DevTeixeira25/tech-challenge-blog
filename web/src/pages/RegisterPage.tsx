import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '../components/ui/Button';
import { Field, FieldError, Hint, Input, Label } from '../components/ui/Form';
import { Alert, Loading } from '../components/ui/Feedback';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/http';
import type { RegisterInput } from '../types';

const Card = styled.div`
  max-width: 460px;
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

/** Código do convite em maiúsculas, como ele é gerado pela API. */
const CodeInput = styled(Input)`
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

/** Estado do formulário: aqui todo campo é string, inclusive o opcional. */
interface FormValues {
  name: string;
  email: string;
  password: string;
  code: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

/**
 * Validação no cliente. O código de convite não entra: ele é opcional e,
 * quando informado, quem confere é a API.
 */
function validate({ name, email, password }: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (name.trim().length < 3) {
    errors.name = 'Informe seu nome completo.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Informe um e-mail válido.';
  }

  if (password.length < 8) {
    errors.password = 'A senha deve ter ao menos 8 caracteres.';
  }

  return errors;
}

/**
 * Cadastro de docente: nome, e-mail e senha bastam.
 * Quem recebeu um convite pode informar o código — o link do convite já traz
 * o valor pronto em ?convite=XXXX-XXXX-XXXX.
 */
export function RegisterPage() {
  const { register, isAuthenticated, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState<FormValues>({
    name: '',
    email: '',
    password: '',
    code: searchParams.get('convite') ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return <Loading label="Verificando sua sessão..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  function handleChange(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const code = values.code.trim().toUpperCase();

      const data: RegisterInput = {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        // Só manda o convite se a pessoa informou algum.
        ...(code ? { code } : {}),
      };

      await register(data);
      // O cadastro já devolve o token, então a pessoa entra direto.
      navigate('/admin', { replace: true });
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível concluir o cadastro. Tente novamente.',
      );
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h1>Criar conta de docente</h1>
      <p>
        Preencha seus dados para publicar no blog. Se você recebeu um código de
        convite, informe-o no final — não é obrigatório.
      </p>

      {submitError && <Alert>{submitError}</Alert>}

      <form onSubmit={handleSubmit} noValidate>
        <Field>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={values.name}
            onChange={(event) => handleChange('name', event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'erro-name' : 'dica-name'}
            autoComplete="name"
            maxLength={120}
          />
          {errors.name ? (
            <FieldError id="erro-name">{errors.name}</FieldError>
          ) : (
            <Hint id="dica-name">
              É o nome que aparece como autor(a) nos posts.
            </Hint>
          )}
        </Field>

        <Field>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => handleChange('email', event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'erro-email' : undefined}
            autoComplete="email"
          />
          {errors.email && (
            <FieldError id="erro-email">{errors.email}</FieldError>
          )}
        </Field>

        <Field>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={values.password}
            onChange={(event) => handleChange('password', event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'erro-password' : 'dica-senha'}
            autoComplete="new-password"
          />
          {errors.password ? (
            <FieldError id="erro-password">{errors.password}</FieldError>
          ) : (
            <Hint id="dica-senha">Use ao menos 8 caracteres.</Hint>
          )}
        </Field>

        <Field>
          <Label htmlFor="code">Código do convite (opcional)</Label>
          <CodeInput
            id="code"
            value={values.code}
            onChange={(event) => handleChange('code', event.target.value)}
            placeholder="XXXX-XXXX-XXXX"
            aria-invalid={Boolean(errors.code)}
            aria-describedby={errors.code ? 'erro-code' : 'dica-code'}
            autoComplete="off"
          />
          {errors.code ? (
            <FieldError id="erro-code">{errors.code}</FieldError>
          ) : (
            <Hint id="dica-code">
              Preencha só se alguém enviou um convite para você.
            </Hint>
          )}
        </Field>

        <Button type="submit" $fullWidth disabled={submitting}>
          {submitting ? 'Criando conta...' : 'Criar conta e entrar'}
        </Button>
      </form>

      <Footer>
        Já tem acesso? <Link to="/login">Entrar</Link>
      </Footer>
    </Card>
  );
}
