# ---------- Estágio 1: build ----------
FROM node:20-alpine AS builder
WORKDIR /app

# OpenSSL é necessário para o Prisma detectar o engine correto no Alpine (musl)
RUN apk add --no-cache openssl libc6-compat

# Instala dependências (inclui devDependencies para compilar)
COPY package*.json ./
RUN npm ci

# Gera o Prisma Client e compila o TypeScript
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Estágio 2: runtime enxuto ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# OpenSSL necessário em runtime para os engines do Prisma
RUN apk add --no-cache openssl libc6-compat

# Apenas dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Prisma Client + schema + código compilado
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

# Aplica migrations e sobe a API
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
