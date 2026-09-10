# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

# --- dev: used by docker-compose for local development (hot reload via volume mount) ---
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# --- build: compiles static assets, used by the production stage below ---
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# --- production: static files served by nginx (for future deployment, e.g. Cloud Run) ---
FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
