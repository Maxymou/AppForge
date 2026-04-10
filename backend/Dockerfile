FROM node:20-bookworm-slim

WORKDIR /app

# Prisma needs a compatible OpenSSL runtime; Debian slim is stable with Prisma 5.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
