FROM node:24-alpine AS webbuild
WORKDIR /build
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production PORT=8000
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=webbuild /build/dist ./public
EXPOSE 8000
CMD ["node", "src/index.js"]