# =============================================================
# Build stage — compila o novo frontend (ia-medico-brilhante)
# O fonte fica em ./frontend/ dentro do contexto do projeto.
# =============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar apenas o manifesto de dependências primeiro (cache de camadas)
COPY frontend/package*.json ./

# Instalar dependências (npm install em vez de npm ci para tolerar lock file desatualizado)
RUN npm install --legacy-peer-deps

# Copiar o restante do fonte do frontend
COPY frontend/ .

# Build de produção — gera a pasta 'build/' (outDir configurado no vite.config.ts)
RUN npm run build

# =============================================================
# Production stage — serve os assets via nginx
# =============================================================
FROM nginx:alpine

# Assets compilados
COPY --from=builder /app/build /usr/share/nginx/html

# Configuração nginx com SPA fallback e security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
