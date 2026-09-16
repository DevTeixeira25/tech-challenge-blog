import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Button, ButtonLink } from '../components/ui/Button';
import { Alert, EmptyState, Loading } from '../components/ui/Feedback';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { postsService } from '../services/posts.service';
import { ApiError } from '../services/http';
import type { Post } from '../types';
import { formatDate } from '../utils/format';

const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(4)};
  margin-bottom: ${({ theme }) => theme.spacing(8)};

  h1 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: ${({ theme }) => theme.spacing(2)};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
`;

/** Linha da lista: empilhada no celular, lado a lado no desktop. */
const Row = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(5)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const Info = styled.div`
  min-width: 0;

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.md};
    margin-bottom: ${({ theme }) => theme.spacing(1)};
  }

  a {
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
  flex-shrink: 0;
`;

/** Página administrativa: lista todos os posts com editar e excluir. */
export function AdminPage() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = useCallback(
    (signal: AbortSignal) => postsService.list(signal),
    [],
  );

  const {
    data: posts,
    error: loadError,
    loading,
    setData,
  } = useAsyncResource<Post[]>('posts', fetchPosts, (err) =>
    err instanceof ApiError ? err.message : 'Não foi possível carregar os posts.',
  );

  async function handleDelete() {
    if (!postToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await postsService.remove(postToDelete.id);
      // Tira da lista em memória: evita uma nova chamada só para atualizar.
      setData((current) =>
        (current ?? []).filter((post) => post.id !== postToDelete.id),
      );
      setFeedback(`Post "${postToDelete.title}" excluído.`);
      setPostToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível excluir o post.',
      );
    } finally {
      setDeleting(false);
    }
  }

  const error = loadError ?? deleteError;
  const hasPosts = Boolean(posts && posts.length > 0);

  return (
    <>
      <Head>
        <div>
          <h1>Administração</h1>
          <p>Todas as postagens publicadas, com opções de editar e excluir.</p>
        </div>

        <ButtonLink to="/posts/novo">+ Novo post</ButtonLink>
      </Head>

      {error && <Alert>{error}</Alert>}
      {feedback && <Alert tone="success">{feedback}</Alert>}

      {loading && <Loading label="Carregando posts..." />}

      {!loading && !hasPosts && !error && (
        <EmptyState
          title="Nenhum post cadastrado"
          description="Crie a primeira postagem para a turma."
        >
          <ButtonLink to="/posts/novo">Criar post</ButtonLink>
        </EmptyState>
      )}

      {!loading && hasPosts && (
        <List>
          {posts?.map((post) => (
            <Row key={post.id}>
              <Info>
                <h2>
                  <Link to={`/posts/${post.id}`}>{post.title}</Link>
                </h2>
                <span>
                  {post.author} · {formatDate(post.createdAt)}
                </span>
              </Info>

              <Actions>
                <ButtonLink
                  to={`/posts/${post.id}/editar`}
                  $variant="secondary"
                >
                  Editar
                  <span className="sr-only"> {post.title}</span>
                </ButtonLink>
                <Button
                  type="button"
                  $variant="danger"
                  onClick={() => {
                    setFeedback(null);
                    setDeleteError(null);
                    setPostToDelete(post);
                  }}
                >
                  Excluir
                  <span className="sr-only"> {post.title}</span>
                </Button>
              </Actions>
            </Row>
          ))}
        </List>
      )}

      {postToDelete && (
        <ConfirmDialog
          title="Excluir postagem"
          description={`O post "${postToDelete.title}" será removido definitivamente.`}
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setPostToDelete(null)}
        />
      )}
    </>
  );
}
