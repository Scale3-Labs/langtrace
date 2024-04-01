# Debian based node 21.6 image
FROM node:21.6-bookworm

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000
