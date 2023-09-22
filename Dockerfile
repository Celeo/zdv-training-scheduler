# syntax=docker/dockerfile:1
FROM node:lts AS runtime

EXPOSE 4321
WORKDIR /app
ENV NODE_ENV="production"
ENV DATABASE_URL="file:///data/sqlite.db"
VOLUME /data

COPY . .
RUN npm ci

RUN --mount=type=secret,id=astro,target=/app/.env npm run astro build
RUN npx prisma migrate deploy

ENV HOST=0.0.0.0
CMD node dist/server/entry.mjs
