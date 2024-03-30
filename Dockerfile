# Debian based node 21.6 image
FROM node:21.6-bookworm as builder

WORKDIR /app

COPY . .

RUN npm install
RUN AZURE_OPENAI_API_KEY="" npm run build

FROM node:21.6-alpine3.19

WORKDIR /app

# Copy only the necessary files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json .
COPY --from=builder /app/prisma ./prisma

# Install only production dependencies
RUN npm install --only=production --omit=dev

CMD ["npm", "start"]
