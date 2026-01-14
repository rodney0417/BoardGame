# Stage 1: 前端編譯 (注意 as 必須是小寫且與後面一致)
FROM node:20-alpine AS frontend-build
WORKDIR /app/client
# 先複製 package.json 安裝依賴
COPY client/package*.json ./
RUN npm install
# 複製前端原始碼並編譯
COPY client/ ./
RUN npm run build

# Stage 2: 後端編譯
FROM node:20-alpine AS backend-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
# 複製後端原始碼與 shared
COPY server/ ./
COPY shared/ ../shared/
# 強制執行 TypeScript 編譯 (產生 dist)
RUN npx tsc --outDir dist --rootDir . --skipLibCheck

# Stage 3: 最終運行環境
FROM node:20-alpine
WORKDIR /app

# 複製後端運行必要的 package.json 並安裝 Production 依賴
COPY server/package*.json ./
RUN npm install --omit=dev

# 關鍵：從之前的階段複製檔案 (請確認 --from 的名稱正確)
COPY --from=backend-build /app/server/dist ./dist
COPY --from=backend-build /app/shared ../shared
# 將前端編譯結果複製到後端的 public 目錄
COPY --from=frontend-build /app/client/dist ./public

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

# 使用 node 啟動
CMD ["node", "dist/index.js"]