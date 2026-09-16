import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loading } from './ui/Feedback';

/**
 * Protege as rotas de criação, edição e administração.
 * Sem login, manda para /login guardando de onde a pessoa veio para
 * devolvê-la ao destino logo após entrar.
 */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Enquanto o token guardado está sendo revalidado, não dá para decidir.
  if (loading) {
    return <Loading label="Verificando sua sessão..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
