import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthProvider';
import { AdminPage } from './pages/AdminPage';
import { EditPostPage } from './pages/EditPostPage';
import { HomePage } from './pages/HomePage';
import { InvitesPage } from './pages/InvitesPage';
import { LoginPage } from './pages/LoginPage';
import { NewPostPage } from './pages/NewPostPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PostPage } from './pages/PostPage';
import { RegisterPage } from './pages/RegisterPage';
import { GlobalStyle } from './styles/GlobalStyle';
import { theme } from './styles/theme';

/**
 * Raiz da aplicação: tema, estado de autenticação e rotas.
 * Criar, editar e administrar ficam dentro de <ProtectedRoute>.
 */
export function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />

      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              {/* Rotas públicas */}
              <Route index element={<HomePage />} />
              <Route path="posts/:id" element={<PostPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="cadastro" element={<RegisterPage />} />

              {/* Rotas restritas a docentes autenticados */}
              <Route element={<ProtectedRoute />}>
                <Route path="posts/novo" element={<NewPostPage />} />
                <Route path="posts/:id/editar" element={<EditPostPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="convites" element={<InvitesPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
