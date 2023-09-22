# syntax=docker/dockerfile:1
FROM node:lts

WORKDIR /app
ENV NODE_ENV="production"
ENV DATABASE_URL="file:///data/sqlite.db"
COPY package.json package-lock.json .
RUN npm ci
COPY . .
RUN mkdir -p /data
VOLUME /data

RUN --mount=type=secret,id=astro,target=/app/.env npm run astro build
RUN prisma migrate deploy

EXPOSE 4321
ENV HOST=0.0.0.0
CMD ["node", "dist/server/entry.mjs"]
