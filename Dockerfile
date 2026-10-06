# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S -G app app
COPY --from=deps  --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/.next          ./.next
COPY --from=build --chown=app:app /app/package.json  ./
COPY --from=build --chown=app:app /app/next.config.ts  ./
COPY --from=build --chown=app:app /app/public          ./public 2>/dev/null || true
USER app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
