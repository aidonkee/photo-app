FROM node:25-alpine AS builder

WORKDIR /school-photo-platform

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN --mount=type=secret,id=my_env \
    source /run/secrets/my_env && \
    npm run build

FROM node:25-alpine AS runner

WORKDIR /school-photo-platform

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /school-photo-platform/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /school-photo-platform/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /school-photo-platform/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /school-photo-platform/.next ./.next

USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
