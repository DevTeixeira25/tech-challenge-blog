import styled from 'styled-components';
import { Input, Label } from './ui/Form';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin-bottom: ${({ theme }) => theme.spacing(6)};
`;

const Row = styled.div`
  position: relative;

  input {
    padding-left: ${({ theme }) => theme.spacing(10)};
  }

  &::before {
    content: '🔎';
    position: absolute;
    top: 50%;
    left: ${({ theme }) => theme.spacing(3)};
    transform: translateY(-50%);
    pointer-events: none;
  }
`;

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
}

/** Campo de busca por palavra-chave da lista de posts. */
export function SearchField({
  value,
  onChange,
  resultCount,
}: SearchFieldProps) {
  return (
    <Wrapper>
      <Label htmlFor="busca">Buscar posts</Label>

      <Row>
        <Input
          id="busca"
          type="search"
          placeholder="Digite uma palavra-chave (título ou conteúdo)"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
        />
      </Row>

      {/* aria-live anuncia a quantidade de resultados a cada nova busca */}
      <span className="sr-only" aria-live="polite">
        {resultCount === undefined
          ? ''
          : `${resultCount} post(s) encontrado(s)`}
      </span>
    </Wrapper>
  );
}
