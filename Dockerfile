# Debian based node 21.6 image
FROM node:21.6-bookworm AS development

LABEL maintainer="Langtrace AI <contact@langtrace.ai>"
LABEL version="1.0"
LABEL description="Open source observability for your LLM applications."
LABEL url="https://langtrace.ai/"
LABEL vendor="Scale3Labs"
LABEL license="AGPL"

WORKDIR /app

RUN apt update && apt install postgresql-client -y

COPY . .

RUN npm install

EXPOSE 3000

CMD [ "/bin/sh", "-c", "bash entrypoint.sh" ]


# Intermediate image for building the application for production
FROM development AS builder

WORKDIR /app

ARG LANGTRACE_VERSION

RUN POSTHOG_API_KEY=$POSTHOG_API_KEY NEXT_PUBLIC_ENABLE_ADMIN_LOGIN=true NEXT_PUBLIC_LANGTRACE_VERSION=$LANGTRACE_VERSION npm run build

# Final release image
FROM node:21.6-bookworm AS production

WORKDIR /app

RUN apt update && apt install postgresql-client -y

# Copy only the necessary files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json .
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules ./node_modules
COPY ./entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

CMD [ "/bin/sh", "-c", "bash entrypoint.sh" ]

EXPOSE 3000
