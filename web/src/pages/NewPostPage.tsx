import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PostForm } from '../components/PostForm';
import { useAuth } from '../hooks/useAuth';
import { postsService } from '../services/posts.service';
import type { PostInput } from '../types';
import { defaultAuthorName } from '../utils/format';

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

/** Página de criação de postagens (restrita a docentes autenticados). */
export function NewPostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  async function handleCreate(data: PostInput) {
    const created = await postsService.create(data);
    navigate(`/posts/${created.id}`, { replace: true });
  }

  return (
    <>
      <Head>
        <h1>Nova postagem</h1>
        <p>Escreva o conteúdo e publique para a turma.</p>
      </Head>

      <PostForm
        // A assinatura vem pronta a partir do nome de quem está logado
        // ("Jefferson de Oliveira da Costa Teixeira" vira "Prof. Jefferson
        // Teixeira"), mas é editável.
        initialValue={{
          title: '',
          content: '',
          author: defaultAuthorName(user?.name ?? ''),
        }}
        submitLabel="Publicar post"
        onSubmit={handleCreate}
      />
    </>
  );
}
