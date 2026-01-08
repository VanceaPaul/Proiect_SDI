FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY public ./public
COPY src ./src
ARG VITE_SIGNALING_URL=ws://localhost:4000/ws
ARG VITE_SIGNALING_API_KEY=dev-api-key
ARG VITE_API_BASE_URL=http://localhost:4000/api
ENV VITE_SIGNALING_URL=${VITE_SIGNALING_URL}
ENV VITE_SIGNALING_API_KEY=${VITE_SIGNALING_API_KEY}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 4173
ENV NODE_ENV=production
CMD ["serve", "-s", "dist", "-l", "4173"]
