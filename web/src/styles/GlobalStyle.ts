import { createGlobalStyle } from 'styled-components';

/** Reset leve + estilos base aplicados uma única vez na aplicação. */
export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  * {
    margin: 0;
  }

  html {
    -webkit-text-size-adjust: 100%;
  }

  body {
    min-height: 100vh;
    font-family: 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue',
      Arial, sans-serif;
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.background};
    -webkit-font-smoothing: antialiased;
  }

  img,
  picture,
  video {
    display: block;
    max-width: 100%;
  }

  input,
  button,
  textarea,
  select {
    font: inherit;
    color: inherit;
  }

  h1, h2, h3, h4 {
    line-height: 1.25;
    text-wrap: balance;
  }

  a {
    color: ${({ theme }) => theme.colors.primaryDark};
  }

  /* Texto só para leitores de tela (complementa rótulos curtos na tela) */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  /* Foco sempre visível: navegação por teclado é requisito de acessibilidade */
  :focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
