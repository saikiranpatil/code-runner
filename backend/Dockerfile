FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/ 

FROM base AS builder
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npx nest build --config nest-cli.json
RUN npx nest build --config worker-cli.json

FROM base AS production-deps
RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3000

FROM runner AS api-server
CMD ["node", "dist/src/main.js"]

FROM runner AS worker-server
CMD ["node", "dist/src/worker.js"]