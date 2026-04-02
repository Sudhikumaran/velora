# API service only — monorepo root has no package.json, so Railway Railpack cannot auto-detect.
# For the SPA, add a second Railway service with root directory `client` or host on Vercel/Netlify.
FROM node:22-alpine AS runner
WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY server/ ./

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/index.js"]
