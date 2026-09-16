import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Button } from './ui/Button';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(4)};
  background-color: rgba(16, 34, 29, 0.5);
  z-index: 50;
`;

const Box = styled.div`
  width: 100%;
  max-width: 420px;
  padding: ${({ theme }) => theme.spacing(6)};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    margin-bottom: ${({ theme }) => theme.spacing(3)};
  }

  p {
    margin-bottom: ${({ theme }) => theme.spacing(6)};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(3)};
`;

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmação para ações destrutivas (excluir post).
 * Fecha com Esc e já abre com o foco no botão de cancelar, que é a
 * escolha segura para quem navega por teclado.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Excluir',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <Overlay
      onClick={(event) => {
        // Clique fora da caixa também cancela.
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
      >
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-desc">{description}</p>

        <Actions>
          <Button
            type="button"
            $variant="secondary"
            ref={cancelRef}
            onClick={onCancel}
            disabled={busy}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            $variant="danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Excluindo...' : confirmLabel}
          </Button>
        </Actions>
      </Box>
    </Overlay>
  );
}
