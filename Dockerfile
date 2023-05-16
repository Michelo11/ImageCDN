FROM node:18-alpine AS base

LABEL org.opencontainers.image.source https://github.com/Wikily/ImageCDN

FROM base AS deps
WORKDIR /app

COPY package.json yarn.lock* ./
COPY prisma ./prisma
ENV YARN_CACHE_FOLDER=/tmp/yarn_cache
RUN --mount=type=cache,target=/tmp/yarn_cache yarn install --prefer-offline --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

RUN yarn build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/build ./build

EXPOSE 4500

CMD ["yarn", "start"]