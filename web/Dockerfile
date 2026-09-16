# ---------- Estágio 1: build do bundle ----------
FROM node:22-alpine AS builder
WORKDIR /app

# A URL da API entra no bundle em tempo de build (é uma SPA estática).
# Troque com: docker build --build-arg VITE_API_URL=https://api.exemplo.com .
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Estágio 2: servidor estático ----------
FROM nginx:1.27-alpine AS runner

# Configuração com fallback para /index.html (rotas do React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# A imagem nginx já sobe como root apenas para bind da porta 80 e troca
# para o usuário nginx nos workers.
CMD ["nginx", "-g", "daemon off;"]
