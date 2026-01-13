# Stage 1: Build Frontend
FROM node:20-alpine as frontend-build
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine as backend-build
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server ./
COPY shared ../shared
# Build TypeScript
RUN npm run build 2>/dev/null || npx tsc

# Stage 3: Production Runtime
FROM node:20-alpine
WORKDIR /app

# Install dependencies (copy entire node_modules from build to include devDeps like tsx)
COPY server/package*.json ./
COPY server/tsconfig.json ./

# Copy modules and source
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/src ./src
COPY --from=backend-build /shared ../shared

# Copy frontend build to public
COPY --from=frontend-build /app/dist ./public

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

CMD ["npm", "start"]
