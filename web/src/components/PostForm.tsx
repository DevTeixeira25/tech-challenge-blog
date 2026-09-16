import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import {
  Field,
  FieldError,
  FormActions,
  Hint,
  Input,
  Label,
  TextArea,
} from './ui/Form';
import { Alert } from './ui/Feedback';
import { ApiError } from '../services/http';
import type { PostInput } from '../types';

interface PostFormProps {
  initialValue?: PostInput;
  submitLabel: string;
  onSubmit: (data: PostInput) => Promise<void>;
}

type FormErrors = Partial<Record<keyof PostInput, string>>;

const emptyPost: PostInput = { title: '', content: '', author: '' };

/** Validação no cliente, espelhando as regras do Zod no back-end. */
function validate({ title, content, author }: PostInput): FormErrors {
  const errors: FormErrors = {};

  if (!title.trim()) {
    errors.title = 'Informe o título do post.';
  } else if (title.trim().length > 200) {
    errors.title = 'O título deve ter no máximo 200 caracteres.';
  }

  if (!content.trim()) {
    errors.content = 'Escreva o conteúdo do post.';
  }

  if (!author.trim()) {
    errors.author = 'Informe quem está publicando.';
  } else if (author.trim().length > 120) {
    errors.author = 'O nome do autor deve ter no máximo 120 caracteres.';
  }

  return errors;
}

/**
 * Formulário compartilhado entre criar e editar post.
 * Quem usa decide o que fazer no envio (POST ou PUT).
 */
export function PostForm({
  initialValue = emptyPost,
  submitLabel,
  onSubmit,
}: PostFormProps) {
  const [values, setValues] = useState<PostInput>(initialValue);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  function handleChange(field: keyof PostInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      await onSubmit({
        title: values.title.trim(),
        content: values.content.trim(),
        author: values.author.trim(),
      });
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível salvar o post. Tente novamente.',
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {submitError && <Alert>{submitError}</Alert>}

      <Field>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={values.title}
          onChange={(event) => handleChange('title', event.target.value)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'erro-title' : undefined}
          maxLength={200}
        />
        {errors.title && <FieldError id="erro-title">{errors.title}</FieldError>}
      </Field>

      <Field>
        <Label htmlFor="author">Autor(a)</Label>
        <Input
          id="author"
          value={values.author}
          onChange={(event) => handleChange('author', event.target.value)}
          aria-invalid={Boolean(errors.author)}
          aria-describedby={errors.author ? 'erro-author' : 'dica-author'}
          maxLength={120}
        />
        {errors.author ? (
          <FieldError id="erro-author">{errors.author}</FieldError>
        ) : (
          <Hint id="dica-author">
            É a assinatura que aparece no post. Pode ser ajustada.
          </Hint>
        )}
      </Field>

      <Field>
        <Label htmlFor="content">Conteúdo</Label>
        <TextArea
          id="content"
          value={values.content}
          onChange={(event) => handleChange('content', event.target.value)}
          aria-invalid={Boolean(errors.content)}
          aria-describedby={errors.content ? 'erro-content' : undefined}
        />
        {errors.content && (
          <FieldError id="erro-content">{errors.content}</FieldError>
        )}
      </Field>

      <FormActions>
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : submitLabel}
        </Button>
        <Button
          type="button"
          $variant="secondary"
          onClick={() => navigate(-1)}
          disabled={saving}
        >
          Cancelar
        </Button>
      </FormActions>
    </form>
  );
}
