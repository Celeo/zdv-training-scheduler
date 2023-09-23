# syntax=docker/dockerfile:1
FROM node:lts

EXPOSE 4321
WORKDIR /app
ENV NODE_ENV="production"
ENV DATABASE_URL="file:///data/sqlite.db"
ENV HOST=0.0.0.0
VOLUME /data

COPY . .
RUN npm ci

RUN npm run astro build
RUN npx prisma migrate deploy

CMD ["node", "dist/server/entry.mjs"]
