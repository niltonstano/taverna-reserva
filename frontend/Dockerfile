# Estágio 1: Build do React
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Produção com Nginx
FROM nginx:stable-alpine

# Copiar o build para a pasta pública do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração customizada para suportar rotas do React (SPA)
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]