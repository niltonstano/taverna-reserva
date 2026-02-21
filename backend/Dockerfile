# Alterado para a versão 22 (LTS) que é estável e compatível
FROM node:22-slim

WORKDIR /app

# Instala dependências necessárias para compilação de módulos nativos
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

# Copia todo o projeto
COPY . .

EXPOSE 3333

# Roda o servidor usando TSX
CMD ["npx", "tsx", "src/server.ts"]