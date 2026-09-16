import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { Header } from './Header';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: ${({ theme }) => theme.maxWidth};
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(8)} ${theme.spacing(4)}`};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => `${theme.spacing(12)} ${theme.spacing(6)}`};
  }
`;

const Footer = styled.footer`
  padding: ${({ theme }) => theme.spacing(6)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`;

/** Atalho para quem navega por teclado pular direto para o conteúdo. */
const SkipLink = styled.a`
  position: absolute;
  left: -9999px;

  &:focus {
    left: ${({ theme }) => theme.spacing(4)};
    top: ${({ theme }) => theme.spacing(4)};
    z-index: 20;
    padding: ${({ theme }) => theme.spacing(3)};
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.radii.md};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

/** Moldura comum a todas as páginas (cabeçalho, conteúdo e rodapé). */
export function Layout() {
  return (
    <Page>
      <SkipLink href="#conteudo">Pular para o conteúdo</SkipLink>
      <Header />

      <Main id="conteudo">
        <Outlet />
      </Main>

      <Footer>
        Tech Challenge FIAP — Blog dos Docentes da rede pública
      </Footer>
    </Page>
  );
}
