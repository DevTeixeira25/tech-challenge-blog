import { EmptyState } from '../components/ui/Feedback';
import { ButtonLink } from '../components/ui/Button';

/** Rota inexistente. */
export function NotFoundPage() {
  return (
    <EmptyState
      title="Página não encontrada"
      description="O endereço acessado não existe ou foi removido."
    >
      <ButtonLink to="/">Voltar para a lista de posts</ButtonLink>
    </EmptyState>
  );
}
