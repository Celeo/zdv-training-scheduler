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

RUN npx prisma generate
RUN npm run astro build

CMD ["node", "dist/server/entry.mjs"]
