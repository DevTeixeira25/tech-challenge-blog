import styled, { css } from 'styled-components';

/** Campos de formulário reutilizados no login e no editor de posts. */

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin-bottom: ${({ theme }) => theme.spacing(5)};
`;

export const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
`;

export const Hint = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const controlStyles = css`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing(2.5)} ${theme.spacing(3)}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.surface};
  /* 16px evita o zoom automático do iOS ao focar o campo */
  font-size: ${({ theme }) => theme.fontSizes.md};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &[aria-invalid='true'] {
    border-color: ${({ theme }) => theme.colors.danger};
  }
`;

export const Input = styled.input`
  ${controlStyles}
`;

export const TextArea = styled.textarea`
  ${controlStyles}
  min-height: 220px;
  resize: vertical;
  line-height: 1.6;
`;

export const FieldError = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.danger};
`;

export const FormActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(3)};
  margin-top: ${({ theme }) => theme.spacing(2)};
`;
