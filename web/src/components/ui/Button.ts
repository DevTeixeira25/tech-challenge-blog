import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  $variant?: Variant;
  $fullWidth?: boolean;
}

/** Estilo compartilhado entre <button> e os links que parecem botão. */
const buttonStyles = css<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  /* 44px de altura mínima: alvo de toque confortável no celular */
  min-height: 44px;
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(4)}`};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${({ theme, $variant = 'primary' }) => {
    const variants: Record<Variant, ReturnType<typeof css>> = {
      primary: css`
        background-color: ${theme.colors.primary};
        color: #fff;

        &:hover:not(:disabled) {
          background-color: ${theme.colors.primaryDark};
        }
      `,
      secondary: css`
        background-color: ${theme.colors.surface};
        border-color: ${theme.colors.border};
        color: ${theme.colors.text};

        &:hover:not(:disabled) {
          border-color: ${theme.colors.primary};
          color: ${theme.colors.primaryDark};
        }
      `,
      danger: css`
        background-color: ${theme.colors.danger};
        color: #fff;

        &:hover:not(:disabled) {
          background-color: #911616;
        }
      `,
      ghost: css`
        background-color: transparent;
        color: ${theme.colors.primaryDark};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.primaryLight};
        }
      `,
    };

    return variants[$variant];
  }}
`;

export const Button = styled.button<ButtonProps>`
  ${buttonStyles}
`;

/** Link do react-router com aparência de botão (ex.: "Novo post"). */
export const ButtonLink = styled(Link)<ButtonProps>`
  ${buttonStyles}
`;
