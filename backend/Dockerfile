FROM node:24-slim
WORKDIR /app

# Instala dependências necessárias para o TSX e compilação de módulos nativos
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

# Copia todo o projeto
COPY . .

EXPOSE 3333

# Roda direto o arquivo TypeScript usando o TSX que já está no seu package.json
CMD ["npx", "tsx", "src/server.ts"]