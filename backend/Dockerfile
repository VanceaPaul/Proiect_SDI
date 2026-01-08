FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY tsconfig.json .
COPY src ./src

RUN npm run build && npm prune --production

FROM node:20-alpine
WORKDIR /app
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist

EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
