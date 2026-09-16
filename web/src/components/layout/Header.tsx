import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

const Bar = styled.header`
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const Inner = styled.div`
  max-width: ${({ theme }) => theme.maxWidth};
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryDark};
  text-decoration: none;
`;

const Toggle = styled(Button)`
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

/**
 * No celular o menu vira uma lista empilhada que abre pelo botão;
 * a partir de 768px ele volta a ser horizontal e sempre visível.
 */
const Nav = styled.nav<{ $open: boolean }>`
  display: ${({ $open }) => ($open ? 'flex' : 'none')};
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  width: 100%;
  padding: ${({ theme }) => `0 ${theme.spacing(4)} ${theme.spacing(4)}`};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: auto;
    padding: 0;
  }
`;

const NavRow = styled.div`
  max-width: ${({ theme }) => theme.maxWidth};
  margin: 0 auto;
`;

const NavItem = styled(NavLink)`
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  text-decoration: none;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryLight};
  }

  &[aria-current='page'] {
    background-color: ${({ theme }) => theme.colors.primaryLight};
    color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const UserBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding-left: ${({ theme }) => theme.spacing(3)};
    border-left: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

/** Cabeçalho com navegação e estado de login do(a) docente. */
export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const closeMenu = () => setMenuOpen(false);

  function handleLogout() {
    logout();
    closeMenu();
    navigate('/');
  }

  return (
    <Bar>
      <Inner>
        <Brand to="/" onClick={closeMenu}>
          <span aria-hidden="true">📚</span> Blog dos Docentes
        </Brand>

        <Toggle
          type="button"
          $variant="secondary"
          aria-expanded={menuOpen}
          aria-controls="menu-principal"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Fechar' : 'Menu'}
        </Toggle>
      </Inner>

      <NavRow>
        <Nav id="menu-principal" $open={menuOpen} aria-label="Principal">
          <NavItem to="/" onClick={closeMenu} end>
            Posts
          </NavItem>

          {isAuthenticated && (
            <>
              <NavItem to="/admin" onClick={closeMenu}>
                Administração
              </NavItem>
              <NavItem to="/posts/novo" onClick={closeMenu}>
                Novo post
              </NavItem>
              <NavItem to="/convites" onClick={closeMenu}>
                Convites
              </NavItem>
            </>
          )}

          {isAuthenticated ? (
            <UserBox>
              <span>
                Olá, <strong>{user?.name}</strong>
              </span>
              <Button type="button" $variant="ghost" onClick={handleLogout}>
                Sair
              </Button>
            </UserBox>
          ) : (
            <NavItem
              to="/login"
              onClick={closeMenu}
              state={{ from: location.pathname }}
            >
              Entrar
            </NavItem>
          )}
        </Nav>
      </NavRow>
    </Bar>
  );
}
