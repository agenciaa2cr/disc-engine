# node:22-alpine — mesma base já usada pelos outros projetos Node na VPS
# (a2cr-site, nebras-app), para não introduzir uma imagem nova no host.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 4100
CMD ["node", "dist/src/api/server.js"]
