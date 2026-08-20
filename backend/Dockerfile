# -----------------------------
# Stage 1 : Build
# -----------------------------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

COPY package*.json ./
COPY prisma ./prisma

RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 600000

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

# -----------------------------
# Stage 2 : Production
# -----------------------------
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/prisma ./prisma

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY register-paths.js ./

EXPOSE 3000

CMD ["node", "-r", "./register-paths.js", "dist/main.js"]