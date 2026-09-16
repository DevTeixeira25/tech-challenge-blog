/** Formata a data da API (ISO) no padrão brasileiro: 13/09/2026. */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Corta o conteúdo para a prévia da lista, sem quebrar palavra no meio. */
export function excerpt(text: string, maxLength = 180): string {
  const clean = text.replace(/\s+/g, ' ').trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  const cut = clean.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');

  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}...`;
}

/**
 * Títulos que já podem vir no começo do nome cadastrado.
 * Quando existe um, ele é preservado em vez de virar outro.
 */
const TITLE_PATTERN =
  /^(prof|profa|professor|professora|dr|dra|me|mestre|mestra)\.?\s+/i;

/** Nome que é só o título, sem nome nenhum depois. */
const TITLE_ONLY =
  /^(prof|profa|professor|professora|dr|dra|me|mestre|mestra)\.?$/i;

/** Partículas que não servem como sobrenome sozinhas. */
const CONNECTIVES = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
  'di',
  'du',
  'del',
  'della',
  'la',
  'le',
  'van',
  'von',
  'y',
]);

/** Sufixos que pedem o sobrenome anterior junto: "Silva Filho", e não "Filho". */
const SUFFIXES = new Set([
  'filho',
  'filha',
  'junior',
  'júnior',
  'jr',
  'neto',
  'neta',
  'sobrinho',
  'sobrinha',
  'segundo',
  'ii',
  'iii',
]);

/** Inicial maiúscula sem mexer no resto (preserva grafias como McCall). */
function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function normalize(word: string): string {
  return word.toLowerCase().replace(/\.$/, '');
}

/**
 * Sugestão de assinatura para o campo "autor(a)" dos posts:
 * título + primeiro nome + sobrenome.
 *
 * "Jefferson de Oliveira da Costa Teixeira" vira "Prof. Jefferson Teixeira";
 * "Profa. Mariana Alves" vira "Profa. Mariana Alves". Partículas ("de", "da")
 * não entram sozinhas como sobrenome, e sufixos como "Filho" e "Júnior" levam
 * junto o sobrenome anterior.
 *
 * É só um padrão — o campo continua editável no formulário.
 */
export function defaultAuthorName(fullName: string): string {
  const clean = fullName.trim().replace(/\s+/g, ' ');

  if (!clean || TITLE_ONLY.test(clean)) {
    return clean;
  }

  const match = clean.match(TITLE_PATTERN);
  const title = match ? match[0].trim() : 'Prof.';
  const parts = (match ? clean.slice(match[0].length) : clean)
    .split(' ')
    .filter(Boolean);

  if (parts.length === 0) {
    return clean;
  }

  const [first, ...others] = parts;
  // O sobrenome sai do último pedaço que não é partícula.
  const candidates = others.filter((part) => !CONNECTIVES.has(normalize(part)));
  const surname: string[] = [];

  if (candidates.length > 0) {
    const last = candidates[candidates.length - 1];

    if (SUFFIXES.has(normalize(last)) && candidates.length > 1) {
      surname.push(candidates[candidates.length - 2]);
    }

    surname.push(last);
  }

  return [title, ...[first, ...surname].map(capitalize)].join(' ');
}
