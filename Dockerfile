FROM node:26-alpine
LABEL org.opencontainers.image.source="https://github.com/ThinktankTokenomics/cloudproject"

ENV NODE_ENV=production \
    PORT=10000

WORKDIR /app
RUN rm -rf \
      /usr/local/lib/node_modules/npm \
      /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm \
      /usr/local/bin/npx \
      /usr/local/bin/corepack \
      /usr/local/share/man/man1/npm.1 \
      /usr/local/share/man/man1/npx.1 \
    && chown node:node /app

USER node
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public

ARG BUILD_SHA=local
ENV BUILD_SHA=${BUILD_SHA}

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:10000/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
