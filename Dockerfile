FROM node:24-alpine

ENV NODE_ENV=production \
    PORT=10000

WORKDIR /app
RUN npm install --global npm@12.2.1 --ignore-scripts --no-audit --no-fund \
    && npm cache clean --force
RUN chown node:node /app

COPY --chown=node:node package.json package-lock.json ./
USER node
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

COPY --chown=node:node src ./src
COPY --chown=node:node public ./public

ARG BUILD_SHA=local
ENV BUILD_SHA=${BUILD_SHA}

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:10000/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
