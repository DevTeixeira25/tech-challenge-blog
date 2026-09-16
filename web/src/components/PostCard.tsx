import { Link } from 'react-router-dom';
import styled from 'styled-components';
import type { Post } from '../types';
import { excerpt, formatDate } from '../utils/format';

const Card = styled.article`
  padding: ${({ theme }) => theme.spacing(5)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: box-shadow 0.15s ease, transform 0.15s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing(6)};
  }
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin-bottom: ${({ theme }) => theme.spacing(2)};

  a {
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.colors.primaryDark};
      text-decoration: underline;
    }
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes.xl};
  }
`;

const Meta = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Excerpt = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const ReadMore = styled(Link)`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

/** Item da lista de posts: título, autor, data e prévia do conteúdo. */
export function PostCard({ post }: { post: Post }) {
  return (
    <Card>
      <Title>
        <Link to={`/posts/${post.id}`}>{post.title}</Link>
      </Title>

      <Meta>
        <span>Por {post.author}</span>
        <span aria-hidden="true">•</span>
        <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
      </Meta>

      <Excerpt>{excerpt(post.content)}</Excerpt>

      <ReadMore to={`/posts/${post.id}`}>
        Ler post completo
        <span className="sr-only"> — {post.title}</span>
      </ReadMore>
    </Card>
  );
}
