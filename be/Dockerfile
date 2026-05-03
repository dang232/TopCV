# Build from repository root: docker build -f be/Dockerfile .
FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable pnpm && corepack prepare pnpm@10.33.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY be/package.json ./be/

RUN pnpm install --frozen-lockfile --filter be...

COPY shared ./shared
COPY be ./be

WORKDIR /app/be
EXPOSE 3000

# @topcv/shared ships TypeScript; tsx runs the API with workspace resolution (see be/package.json "start").
CMD ["pnpm", "exec", "tsx", "src/main.ts"]
