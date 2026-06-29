FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production=false

COPY . .
RUN npm run build

EXPOSE 50052

CMD ["node", "dist/main"]
