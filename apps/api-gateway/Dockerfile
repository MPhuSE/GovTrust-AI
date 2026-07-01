# api-gateway — NestJS edge. Build trong context monorepo root.
FROM node:20-alpine

WORKDIR /app/apps/api-gateway

COPY apps/api-gateway/package.json ./
RUN npm install

COPY apps/api-gateway/ ./
RUN npm run build

EXPOSE 8080

CMD ["node", "dist/main"]
