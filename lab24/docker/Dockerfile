FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
FROM node:22-alpine AS runtime
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node src ./src
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node package.json task5.js ./
RUN mkdir uploads outbox && chown node:node uploads outbox
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s CMD node -e "fetch('http://127.0.0.1:3000/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","task5.js"]
