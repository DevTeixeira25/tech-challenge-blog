import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { PostForm } from '../components/PostForm';
import { Alert, Loading } from '../components/ui/Feedback';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { postsService } from '../services/posts.service';
import { ApiError } from '../services/http';
import type { Post, PostInput } from '../types';

const Head = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(8)};

  h1 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin-bottom: ${({ theme }) => theme.spacing(2)};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

/** Página de edição: carrega os dados atuais do post e salva as alterações. */
export function EditPostPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const fetchPost = useCallback(
    (signal: AbortSignal) => postsService.getById(id, signal),
    [id],
  );

  const {
    data: post,
    error,
    loading,
  } = useAsyncResource<Post>(id, fetchPost, (err) =>
    err instanceof ApiError && err.status === 404
      ? 'Post não encontrado. Ele pode ter sido excluído.'
      : 'Não foi possível carregar o post para edição.',
  );

  async function handleUpdate(data: PostInput) {
    await postsService.update(id, data);
    navigate(`/posts/${id}`, { replace: true });
  }

  return (
    <>
      <Head>
        <h1>Editar postagem</h1>
        <p>Altere o que precisar e salve para atualizar o post.</p>
      </Head>

      {loading && <Loading label="Carregando dados do post..." />}
      {error && <Alert>{error}</Alert>}

      {post && !loading && (
        <PostForm
          // Os campos já chegam preenchidos com o conteúdo atual do post.
          initialValue={{
            title: post.title,
            content: post.content,
            author: post.author,
          }}
          submitLabel="Salvar alterações"
          onSubmit={handleUpdate}
        />
      )}
    </>
  );
}
