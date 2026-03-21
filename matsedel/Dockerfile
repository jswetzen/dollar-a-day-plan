# ── Stage 1: build the React frontend ──────────────────────────────────────
FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /build
COPY frontend/package.json frontend/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY frontend/ ./
COPY lidl_items.csv /build/lidl_items.csv
COPY scripts/ /build/scripts/
RUN node scripts/parse-lidl.js && pnpm build

# ── Stage 2: PocketBase runtime ────────────────────────────────────────────
FROM alpine:latest

RUN apk --no-cache add ca-certificates

COPY pocketbase /usr/local/bin/pocketbase
COPY --from=builder /pb_public /app/pb_public
COPY pb_migrations /app/pb_migrations

WORKDIR /app

VOLUME /app/pb_data

EXPOSE 8090

CMD ["pocketbase", "serve", "--http=0.0.0.0:8090"]
