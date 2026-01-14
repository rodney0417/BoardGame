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

# 使用 tsx 直接運行，不需要編譯
# 因為 tsx 可以在運行時處理 TypeScript

# ==========================================
# Stage 3: 最終運行環境 (Production with tsx)
# ==========================================
FROM node:20-alpine
WORKDIR /app

# 複製 package.json 並安裝所有依賴 (包含 tsx)
COPY server/package*.json ./
COPY server/tsconfig.json ./
RUN npm install

# 複製原始碼
COPY --from=backend-build /app/server/src ./src
COPY --from=backend-build /app/shared ../shared

# 從 frontend-build 複製前端靜態檔案
COPY --from=frontend-build /app/client/dist ./public

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

# 使用 npm start (會執行 tsx 或 node)
CMD ["npm", "start"]