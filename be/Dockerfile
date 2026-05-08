# Build from repository root: docker build -f be/Dockerfile .
FROM node:20-bookworm-slim AS base

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable pnpm && corepack prepare pnpm@10.33.2 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY be/package.json ./be/

RUN pnpm install --frozen-lockfile --filter be...

FROM deps AS build

ENV NODE_ENV=development

COPY shared ./shared
COPY be ./be

RUN pnpm --filter @topcv/shared exec tsc -p tsconfig.json --noEmit false --outDir dist

WORKDIR /app/be
RUN pnpm build

FROM deps AS prod-deps


RUN pnpm prune --prod

FROM base AS runtime

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/be/node_modules ./be/node_modules
COPY --from=prod-deps --chown=node:node /app/shared/node_modules ./shared/node_modules
COPY --from=prod-deps --chown=node:node /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=prod-deps --chown=node:node /app/be/package.json ./be/package.json
COPY --from=prod-deps --chown=node:node /app/shared/package.json ./shared/package.json
COPY --from=build --chown=node:node /app/be/dist ./be/dist
COPY --from=build --chown=node:node /app/shared/dist ./shared/dist

RUN node -e "const fs=require('fs'); const p='/app/shared/package.json'; const pkg=JSON.parse(fs.readFileSync(p,'utf8')); pkg.exports={'.':'./dist/index.js','./auth':'./dist/auth/index.js','./forms':'./dist/forms/index.js','./transport':'./dist/transport/index.js','./user':'./dist/user.schema.js'}; fs.writeFileSync(p, JSON.stringify(pkg, null, 2));"

WORKDIR /app/be
USER node
EXPOSE 3000

# @topcv/shared ships TypeScript; tsx runs the API with ESM resolution (extensionless imports).
CMD ["pnpm", "exec", "tsx", "dist/src/main.js"]
