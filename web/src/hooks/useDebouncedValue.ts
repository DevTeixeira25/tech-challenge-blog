import { useEffect, useState } from 'react';

/**
 * Devolve o valor só depois de `delay` ms sem mudanças.
 * Usado na busca para não disparar uma chamada à API a cada tecla.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
