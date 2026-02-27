# 1. Imagem base (Versão 24 para bater com seu engines do package.json)
FROM node:24-slim AS build

# 2. Diretório de trabalho
WORKDIR /app

# 3. Dependências para módulos nativos (bcrypt, etc)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 4. Instalação de dependências (Cache inteligente)
COPY package*.json ./
RUN npm install

# 5. Copia o código e compila
COPY . .
RUN npm run build

# --- ESTÁGIO DE EXECUÇÃO (Imagem mais leve e segura) ---
FROM node:24-slim

WORKDIR /app

# Copia apenas o que é necessário da build anterior
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules


# 6. RESOLUÇÃO DAS IMAGENS: Usamos RUN para permitir lógica de shell
RUN mkdir -p dist/src
RUN cp src/*.webp dist/src/ 2>/dev/null || echo "Nenhuma imagem webp encontrada, pulando..."

# 7. SEGURANÇA: Roda como usuário 'node' (não-root)
RUN chown -R node:node /app
USER node

# 8. Porta da API
EXPOSE 3333

# 9. Comando de inicialização oficial
CMD ["node", "dist/src/server.js"]