import styled, { keyframes } from 'styled-components';

/** Mensagens de estado: erro, sucesso, carregando e lista vazia. */

const Box = styled.div<{ $tone: 'error' | 'success' }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
  margin-bottom: ${({ theme }) => theme.spacing(5)};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'error' ? theme.colors.danger : theme.colors.success};
  background-color: ${({ theme, $tone }) =>
    $tone === 'error' ? theme.colors.dangerLight : theme.colors.successLight};
  color: ${({ theme, $tone }) =>
    $tone === 'error' ? theme.colors.danger : theme.colors.success};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

interface AlertProps {
  children: React.ReactNode;
  tone?: 'error' | 'success';
}

/**
 * `role="alert"` faz o leitor de tela anunciar a mensagem assim que ela
 * aparece — importante para quem não vê a mudança na tela.
 */
export function Alert({ children, tone = 'error' }: AlertProps) {
  return (
    <Box $tone={tone} role="alert">
      {children}
    </Box>
  );
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Spinner = styled.span`
  width: 22px;
  height: 22px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const LoadingBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(10)};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export function Loading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <LoadingBox role="status" aria-live="polite">
      <Spinner aria-hidden="true" />
      <span>{label}</span>
    </LoadingBox>
  );
}

const EmptyBox = styled.div`
  padding: ${({ theme }) => theme.spacing(10)};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};

  strong {
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing(2)};
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`;

interface EmptyStateProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <EmptyBox>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {children}
    </EmptyBox>
  );
}
