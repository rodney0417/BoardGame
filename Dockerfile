# ==========================================
# Stage 1: 前端編譯 (React)
# ==========================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: 後端編譯 (Node.js + TypeScript)
# ==========================================
FROM node:20-alpine AS backend-build
WORKDIR /app
# 複製後端與共享代碼
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server/ ./server/
COPY shared/ ./shared/

# 執行編譯。我們從 /app 層級執行，rootDir 設為 . 
# 這樣才能合法包含 ./server 和 ./shared
RUN npx tsc --project server/tsconfig.json --rootDir . --outDir build --skipLibCheck

# ==========================================
# Stage 3: 最終運行環境 (Production)
# ==========================================
FROM node:20-alpine
WORKDIR /app

# 只安裝生產環境需要的套件
COPY server/package*.json ./
RUN npm install --omit=dev

# 從 backend-build 複製編譯好的 JS 檔案
# 注意：因為 rootDir 為 .，tsc 會保持目錄結構，
# 你的入口檔案會出現在 build/server/src/index.js
# 我們把它移到 dist 以便簡化啟動路徑
COPY --from=backend-build /app/build/server/src ./dist
# 複製編譯後的 shared (如果有的話) 或原始檔案
COPY --from=backend-build /app/shared ../shared

# 從 frontend-build 複製前端靜態檔案到後端指定的 public 目錄
COPY --from=frontend-build /app/client/dist ./public

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

# 啟動命令 (確保路徑指向 dist/index.js)
CMD ["node", "dist/index.js"]