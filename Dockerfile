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

# Install production dependencies only if possible, but for simplicity copy all
COPY server/package*.json ./
RUN npm install --production

# Copy compiled backend
# Note: Assuming 'tsc' outputs to 'dist'. If using 'tsx' directly in prod, we copy src.
# To be safe and consistent with previous behavior, let's copy source and run with tsx if build fails/is complex, 
# BUT standard practice is running compiled JS.
# Checking server/package.json -> It uses `tsx src/index.ts` for dev. It doesn't have a build script properly defined for output?
# Let's adjust: We will copy source and use tsx for now to match 'npm start' behavior if it wraps tsx, 
# OR we install tsx globally.
# Actually, let's look at package.json again. 
# "start": "tsx src/index.ts"
# So we need tsx in production.

RUN npm install -g tsx

COPY --from=backend-build /app/src ./src
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /shared ../shared

# Copy frontend build to public
COPY --from=frontend-build /app/dist ./public

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

CMD ["tsx", "src/index.ts"]
