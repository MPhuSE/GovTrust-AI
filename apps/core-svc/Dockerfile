# core-svc — NestJS business + Mongo. Build context = monorepo root.
FROM node:20-alpine

WORKDIR /app

# 1. Build rule-engine (TS thuần) → dist
COPY packages/rule-engine ./packages/rule-engine
WORKDIR /app/packages/rule-engine
RUN npm install && npm run build

# 2. proto + data dùng chung
WORKDIR /app
COPY packages/proto ./packages/proto
COPY data ./data

# 3. Deps core-svc (bỏ dòng workspace:* để npm không lỗi, ta tự link ở bước 5)
COPY apps/core-svc/package.json ./apps/core-svc/
WORKDIR /app/apps/core-svc
RUN sed -i '/@govtrust\/rule-engine/d' package.json && npm install

# 4. Link rule-engine đã build vào node_modules để require() chạy được runtime
RUN mkdir -p node_modules/@govtrust/rule-engine \
 && cp -r /app/packages/rule-engine/dist node_modules/@govtrust/rule-engine/dist \
 && cp /app/packages/rule-engine/package.json node_modules/@govtrust/rule-engine/package.json

# 5. Source + build core-svc
COPY apps/core-svc/ ./
RUN npm run build

EXPOSE 4000

CMD ["node", "dist/main"]
