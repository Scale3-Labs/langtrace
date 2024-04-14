# Debian based node 21.6 image
FROM node:21.6-bookworm

LABEL maintainer="Langtrace AI <contact@langtrace.ai>"
LABEL version="1.0"
LABEL description="Open source observability for your LLM applications."
LABEL url="https://langtrace.ai/"
LABEL vendor="Scale3Labs"
LABEL license="AGPL"

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000
