FROM node:24-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:24-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:24-alpine AS build-env
# Les variables VITE_* sont figées dans le code envoyé au navigateur au moment du build : l'hébergeur
# les passe en arguments de build (Render le fait pour les variables du service). Elles priment sur
# .env.production, dont l'adresse d'API ne sert qu'aux builds locaux.
ARG VITE_API_BASE_URL
ARG VITE_APP_ENV=production
ARG VITE_ENABLE_MOCKS=false
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
# Sans adresse fournie, on garde celle de .env.production au lieu d'une valeur vide.
RUN if [ -z "$VITE_API_BASE_URL" ]; then unset VITE_API_BASE_URL; fi && npm run build

FROM node:24-alpine
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
CMD ["npm", "run", "start"]
