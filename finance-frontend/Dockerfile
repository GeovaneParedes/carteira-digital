# ── Stage 1: Build das dependências e da aplicação Next.js ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copia os arquivos de pacotes para cache otimizado das camadas
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Habilita standalone no build do Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 2: Imagem final de execução ultra-leve (Menor Privilégio) ──
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia a estrutura otimizada standalone do Next.js
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
