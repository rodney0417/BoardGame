# ... Stage 1 Frontend 不變 ...

# Stage 2: Build Backend
FROM node:20-alpine as backend-build
WORKDIR /app/server
# 複製 package.json
COPY server/package*.json ./
RUN npm install

# 複製 server 原始碼與 shared 代碼
COPY server/ ./
COPY shared/ ../shared/

# 執行編譯 (這會產生 /app/server/dist)
RUN npm run build

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

# 複製執行環境
COPY server/package*.json ./
RUN npm install --omit=dev

# 從編譯階段複製結果
# 注意：我們將 dist 內容複製到 /app/dist
COPY --from=backend-build /app/server/dist ./dist
COPY --from=backend-build /app/shared ../shared

# 複製前端
COPY --from=frontend-build /app/dist ./public

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

# 啟動命令
CMD ["node", "dist/index.js"]