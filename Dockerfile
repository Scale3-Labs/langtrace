# Debian based node 21.6 image
FROM node:21.6-bookworm AS development

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

CMD [ "/bin/sh", "-c", "npm run dev" ]


# Intermediate image for building the application
FROM development AS builder

WORKDIR /app

RUN NEXT_PUBLIC_ENABLE_ADMIN_LOGIN=true npm run build

# Final release image
FROM node:21.6-bookworm AS production

WORKDIR /app

# Copy only the necessary files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json .
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts

# Install only production dependencies
RUN npm install --only=production --omit=dev

CMD [ "/bin/sh", "-c", "npm start" ]

EXPOSE 3000
