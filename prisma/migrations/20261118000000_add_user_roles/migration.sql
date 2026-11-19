-- O padrão preserva como docentes todas as contas anteriores à Fase 4.
CREATE TYPE "Role" AS ENUM ('TEACHER', 'STUDENT');
ALTER TABLE "users" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'TEACHER';
