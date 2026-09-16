import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Alert, Loading } from '../components/ui/Feedback';
import { ButtonLink } from '../components/ui/Button';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useAuth } from '../hooks/useAuth';
import { postsService } from '../services/posts.service';
import { ApiError } from '../services/http';
import type { Post } from '../types';
import { formatDate } from '../utils/format';

const Back = styled(Link)`
  display: inline-block;
  margin-bottom: ${({ theme }) => theme.spacing(6)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
`;

const Article = styled.article`
  padding: ${({ theme }) => theme.spacing(6)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing(10)};
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin-bottom: ${({ theme }) => theme.spacing(3)};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes.xxl};
  }
`;

const Meta = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(2)};
  padding-bottom: ${({ theme }) => theme.spacing(5)};
  margin-bottom: ${({ theme }) => theme.spacing(6)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

/** Mantém as quebras de linha digitadas pelo(a) docente no editor. */
const Content = styled.div`
  white-space: pre-wrap;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  line-height: 1.75;
`;

const EditBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
  margin-top: ${({ theme }) => theme.spacing(8)};
  padding-top: ${({ theme }) => theme.spacing(5)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

/** Página de leitura: mostra o conteúdo completo de um post. */
export function PostPage() {
  const { id = '' } = useParams();
  const { isAuthenticated } = useAuth();

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
      : 'Não foi possível carregar o post.',
  );

  return (
    <>
      <Back to="/">← Voltar para a lista</Back>

      {loading && <Loading label="Carregando post..." />}
      {error && <Alert>{error}</Alert>}

      {post && !loading && (
        <Article>
          <Title>{post.title}</Title>

          <Meta>
            <span>Por {post.author}</span>
            <span aria-hidden="true">•</span>
            <time dateTime={post.createdAt}>
              Publicado em {formatDate(post.createdAt)}
            </time>
            {post.updatedAt !== post.createdAt && (
              <>
                <span aria-hidden="true">•</span>
                <time dateTime={post.updatedAt}>
                  Editado em {formatDate(post.updatedAt)}
                </time>
              </>
            )}
          </Meta>

          <Content>{post.content}</Content>

          {isAuthenticated && (
            <EditBar>
              <ButtonLink to={`/posts/${post.id}/editar`} $variant="secondary">
                Editar este post
              </ButtonLink>
            </EditBar>
          )}
        </Article>
      )}
    </>
  );
}
