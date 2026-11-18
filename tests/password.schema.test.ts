import { registerSchema, loginSchema } from '../src/schemas/auth.schema';
import { createPersonSchema, updatePersonSchema } from '../src/schemas/people.schema';
import { newPasswordSchema } from '../src/schemas/password.schema';

const person = { name: 'Pessoa Teste', email: 'pessoa@example.test' };
describe('Senhas novas limitadas a 72 bytes UTF-8', () => {
  it.each(['a'.repeat(72), 'á'.repeat(36), '😀'.repeat(18)])('aceita senha no limite exato de bytes', (password) => {
    expect(Buffer.byteLength(password, 'utf8')).toBe(72);
    expect(newPasswordSchema.safeParse(password).success).toBe(true);
    expect(registerSchema.safeParse({ ...person, password }).success).toBe(true);
    expect(createPersonSchema.safeParse({ ...person, password }).success).toBe(true);
    expect(updatePersonSchema.safeParse({ password }).success).toBe(true);
  });
  it.each(['a'.repeat(73), 'á'.repeat(37), '😀'.repeat(19)])('rejeita senha que seria truncada pelo bcrypt', (password) => {
    expect(Buffer.byteLength(password, 'utf8')).toBeGreaterThan(72);
    expect(newPasswordSchema.safeParse(password).success).toBe(false);
    expect(registerSchema.safeParse({ ...person, password }).success).toBe(false);
    expect(createPersonSchema.safeParse({ ...person, password }).success).toBe(false);
    expect(updatePersonSchema.safeParse({ password }).success).toBe(false);
  });
  it('preserva validação de login para contas legadas', () => {
    expect(loginSchema.safeParse({ email: person.email, password: 'á'.repeat(37) }).success).toBe(true);
  });
});
