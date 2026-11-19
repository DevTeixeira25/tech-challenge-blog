import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { NotFoundError } from '../errors/AppError';
import { peopleRepository, PeopleRepository } from '../repositories/people.repository';
import { CreatePersonInput, UpdatePersonInput } from '../schemas/people.schema';

export class PeopleService {
  constructor(private readonly repo: PeopleRepository = peopleRepository) {}
  list(role: Role, page: number, pageSize: number) {
    return this.repo.list(role, page, pageSize);
  }
  async getById(id: string, role: Role) {
    const person = await this.repo.findById(id, role);
    if (!person) throw new NotFoundError('Pessoa não encontrada neste perfil');
    return person;
  }
  async create(role: Role, { name, email, password }: CreatePersonInput) {
    return this.repo.create({ name, email, role, passwordHash: await bcrypt.hash(password, 10) });
  }
  async update(id: string, role: Role, { password, ...fields }: UpdatePersonInput) {
    await this.getById(id, role);
    const data = password ? { ...fields, passwordHash: await bcrypt.hash(password, 10) } : fields;
    return this.repo.update(id, role, data);
  }
  async remove(id: string, role: Role, actorId: string) {
    // A transação revalida o ator e preserva ao menos uma conta docente.
    await this.repo.remove(id, role, actorId);
  }
}
export const peopleService = new PeopleService();
