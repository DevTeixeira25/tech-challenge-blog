import 'styled-components';
import type { AppTheme } from './theme';

// Faz o `props.theme` dos styled-components ser tipado com o nosso tema.
declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
