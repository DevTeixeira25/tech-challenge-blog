import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { PostCard } from '../components/PostCard';
import { SearchField } from '../components/SearchField';
import { Alert, EmptyState, Loading } from '../components/ui/Feedback';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { postsService } from '../services/posts.service';
import { ApiError } from '../services/http';
import type { Post } from '../types';

const Intro = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(8)};

  h1 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: ${({ theme }) => theme.spacing(2)};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    h1 {
      font-size: ${({ theme }) => theme.fontSizes.xxl};
    }
  }
`;

const List = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};
`;

/** Página principal: lista os posts e permite buscar por palavra-chave. */
export function HomePage() {
  const [term, setTerm] = useState('');

  // Espera a pessoa parar de digitar antes de chamar a API.
  const debouncedTerm = useDebouncedValue(term).trim();

  const fetchPosts = useCallback(
    (signal: AbortSignal) =>
      debouncedTerm
        ? postsService.search(debouncedTerm, signal)
        : postsService.list(signal),
    [debouncedTerm],
  );

  const {
    data: posts,
    error,
    loading,
  } = useAsyncResource<Post[]>(debouncedTerm, fetchPosts, (err) =>
    err instanceof ApiError ? err.message : 'Não foi possível carregar os posts.',
  );

  const hasPosts = Boolean(posts && posts.length > 0);

  return (
    <>
      <Intro>
        <h1>Posts da turma</h1>
        <p>
          Aulas, materiais e novidades publicados pelos(as) docentes da rede
          pública.
        </p>
      </Intro>

      <SearchField
        value={term}
        onChange={setTerm}
        resultCount={loading ? undefined : (posts?.length ?? 0)}
      />

      {error && <Alert>{error}</Alert>}

      {loading && <Loading label="Carregando posts..." />}

      {!loading && !error && !hasPosts && (
        <EmptyState
          title={
            debouncedTerm
              ? 'Nenhum post encontrado'
              : 'Ainda não há posts publicados'
          }
          description={
            debouncedTerm
              ? `Nada corresponde a "${debouncedTerm}". Tente outra palavra-chave.`
              : 'Assim que um(a) docente publicar, o post aparece aqui.'
          }
        />
      )}

      {!loading && hasPosts && (
        <List>
          {posts?.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </List>
      )}
    </>
  );
}
