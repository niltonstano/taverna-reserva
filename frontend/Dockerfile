# Estágio 1: Build do Frontend (Vite)
FROM node:20-alpine AS build

# Argumento necessário para "carimbar" a URL da API no JS durante o build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

# Instalação de dependências (aproveitando o cache de camadas do Docker)
COPY package*.json ./
RUN npm install

# Copia o código e gera a versão de produção
COPY . .
RUN npm run build

# Estágio 2: Servidor Web (Nginx)
FROM nginx:stable-alpine

# Copia os arquivos gerados no estágio anterior para o Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração para garantir que o React/Vite lide bem com as rotas (SPA)
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files \$uri \$uri/ /index.html; \
    } \
    error_page 500 502 503 504 /50x.html; \
    location = /50x.html { \
        root /usr/share/nginx/html; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]