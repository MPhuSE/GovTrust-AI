# web — Next.js Citizen App + Officer Dashboard
FROM node:20-alpine

WORKDIR /app

# NEXT_PUBLIC_* phải có mặt lúc `next build` vì Next inline chúng vào bundle client.
ARG NEXT_PUBLIC_API_URL=/gw
ARG NEXT_PUBLIC_APP_NAME="GovTrust AI"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
