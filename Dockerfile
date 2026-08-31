ARG APP_NAME

# ─── Deps ──────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
ARG APP_NAME
RUN npm install -g pnpm@9
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/${APP_NAME}/package.json ./apps/${APP_NAME}/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json

RUN pnpm install --frozen-lockfile

# ─── Builder ───────────────────────────────────────────────────────────────────
FROM deps AS builder
ARG APP_NAME
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ANALYTICS_ENABLED

COPY . .
RUN pnpm --filter ${APP_NAME} build

# ─── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

COPY --from=builder /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=builder /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public

# Everything copied above lands root-owned, but the server runs as appuser.
# Next's image optimiser writes its optimised variants to
# .next/cache/images at RUNTIME — with no writable directory it fails
# silently, never caches, and re-encodes every image on every request.
# That is exactly what the live box was doing: `x-nextjs-cache: MISS` on
# every request, including immediate repeats of the same URL.
#
# Creating the cache directory and handing it to appuser is the whole fix.
# It must happen before the USER switch, while this stage is still root.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /app/apps/${APP_NAME}/.next/cache \
    && chown -R appuser:appgroup /app/apps/${APP_NAME}/.next/cache
USER appuser

EXPOSE 3000
CMD ["sh", "-c", "node apps/${APP_NAME}/server.js"]
