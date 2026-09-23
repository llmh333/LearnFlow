# Multi-stage build (Phase 8, D15): Vite build -> Caddy image. Caddy is both the static file
# server AND the HTTPS-terminating reverse proxy to backend — no separate nginx/caddy containers,
# keeping the VPS down to exactly 2 running containers.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443
