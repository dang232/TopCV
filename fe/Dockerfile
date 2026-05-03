# Build from repository root: docker build -f fe/Dockerfile .
# Pass public env at build time, e.g.:
#   docker build -f fe/Dockerfile --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com .
FROM node:20-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable pnpm && corepack prepare pnpm@10.33.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY fe/package.json ./fe/

RUN pnpm install --frozen-lockfile --filter my-app...

COPY shared ./shared
COPY fe ./fe

ARG NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3000
ARG NEXT_PUBLIC_KEYCLOAK_URL=http://127.0.0.1:8080
ARG NEXT_PUBLIC_KEYCLOAK_REALM=topcv
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=topcv-web

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_KEYCLOAK_URL=$NEXT_PUBLIC_KEYCLOAK_URL
ENV NEXT_PUBLIC_KEYCLOAK_REALM=$NEXT_PUBLIC_KEYCLOAK_REALM
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=$NEXT_PUBLIC_KEYCLOAK_CLIENT_ID

RUN pnpm --filter my-app build

WORKDIR /app/fe
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["pnpm", "exec", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
