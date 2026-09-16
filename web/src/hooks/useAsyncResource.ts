import { useCallback, useEffect, useRef, useState } from 'react';

interface Result<T> {
  /** Chave a que os dados guardados correspondem. */
  key: string;
  data: T | null;
  error: string | null;
}

export interface AsyncResource<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** Refaz a busca (usado depois de mudar algo no servidor). */
  reload: () => void;
  /** Atualiza os dados em memória, sem ir na API (ex.: após excluir). */
  setData: (updater: (current: T | null) => T | null) => void;
}

/**
 * Busca dados da API e devolve os três estados que as telas precisam:
 * carregando, erro e dados.
 *
 * `loading` é derivado (comparando a chave dos dados guardados com a chave
 * atual) em vez de virar um setState dentro do efeito — é o que evita os
 * renders em cascata apontados pela regra `react-hooks/set-state-in-effect`.
 *
 * @param key      identifica a busca (id do post, termo buscado...). Mudou a
 *                 chave, refaz a chamada.
 * @param fetcher  função que chama a API; recebe o signal para cancelamento.
 * @param toMessage traduz o erro em mensagem para a pessoa usuária.
 */
export function useAsyncResource<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  toMessage: (err: unknown) => string,
): AsyncResource<T> {
  // Guardados em refs para a busca não ser refeita a cada render só porque
  // as funções mudaram de identidade.
  const fetcherRef = useRef(fetcher);
  const messageRef = useRef(toMessage);

  useEffect(() => {
    fetcherRef.current = fetcher;
    messageRef.current = toMessage;
  });

  const [result, setResult] = useState<Result<T>>({
    key: '',
    data: null,
    error: null,
  });
  const [reloadCount, setReloadCount] = useState(0);

  const currentKey = `${reloadCount}:${key}`;
  const loading = result.key !== currentKey;

  useEffect(() => {
    const controller = new AbortController();

    fetcherRef
      .current(controller.signal)
      .then((data) => setResult({ key: currentKey, data, error: null }))
      .catch((err) => {
        // Busca cancelada (a chave mudou): a próxima já está a caminho.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setResult({
          key: currentKey,
          data: null,
          error: messageRef.current(err),
        });
      });

    return () => controller.abort();
  }, [currentKey]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  const setData = useCallback(
    (updater: (current: T | null) => T | null) =>
      setResult((current) => ({ ...current, data: updater(current.data) })),
    [],
  );

  return { data: result.data, error: result.error, loading, reload, setData };
}
