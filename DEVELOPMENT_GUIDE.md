# 萬遊引力 (BoardGame Hub) 開發指南

本專案採用 **Clean Architecture + DDD (Domain-Driven Design)** 架構，並強烈建議使用 **TDD (Test-Driven Development)** 進行開發。本指南旨在統一開發標準，確保後續擴充遊戲時架構的一致性。

---

## 🏗️ 專案架構 (Project Structure)

專案分為 `client` (React + Vite) 與 `server` (Node.js + Socket.IO) 兩大部分。

### Server 端 (`server/src/`)

Server 端核心邏輯不依賴框架 (Socket.IO)，而是專注於純粹的領域邏輯 (Domain Logic)。

```text
server/src/
├── domain/           # 共用領域層 (Core Domain)
│   ├── room/         # 房間管理邏輯 (Room, repository)
│   └── user/         # 使用者管理邏輯
├── games/            # 遊戲模組 (各遊戲獨立)
│   ├── shared/       # 遊戲共用邏輯 (如 Deck, Timer)
│   ├── pictomania/   # [範例] 妙筆神猜模組
│   │   ├── domain.ts # 純領域邏輯 (Game State, Round Logic) - TDD 重點
│   │   └── index.ts  # 遊戲入口與 Socket 事件綁定 (Controller)
│   └── uno/          # [範例] UNO 模組
├── infrastructure/   # 基礎設施層
│   └── socket/       # Socket.IO 連線處理
└── __tests__/        # 測試代碼 (Unit Tests)
```

### Client 端 (`client/src/`)

Client 端採用模組化組件設計，並提取共用 UI 以維持視覺一致性 (Morandi Theme)。

```text
client/src/
├── components/       # 全域共用組件 (Navbar, Toast)
├── domains/          # 領域視圖 (Lobby, User, Login)
├── games/            # 遊戲模組
│   ├── shared/       # ⚠️ 遊戲共用模組 (必讀)
│   │   ├── gameConfig.ts  # 遊戲設定檔 (顏色, Icon, 規則)
│   │   ├── GameLobby.tsx  # 共用等待大廳
│   │   └── GameOver.tsx   # 共用結束畫面
│   ├── pictomania/   # [範例] 妙筆神猜 UI
│   └── uno/          # [範例] UNO UI
└── index.css         # 全域樣式 (Morandi Theme 變數)
```

---

## 🧪 開發流程 (DDD + TDD)

開發新遊戲時，請遵循 **"Domain First, UI Last"** 的原則。

### Step 1: Server Domain Logic (TDD)

1. 在 `server/src/games/` 建立新遊戲資料夾。
2. 建立 `domain.ts` 定義遊戲狀態 (State) 與規則 (Rules)。
3. **編寫測試**：先在 `server/src/__tests__/` 或同級目錄寫測試案例，定義遊戲流程（開始、出牌、結算）。
4. **實作邏輯**：實作 `domain.ts` 直到測試通過。此階段**不涉及** Socket 或 DB。

### Step 2: Server Socket Integration

1. 建立 `index.ts` 實作 `GameModule` 介面。
2. 綁定 Socket 事件，呼叫 `domain.ts` 的邏輯。
3. 透過 `socket.emit` 發送更新後的 `gameState` 給 Client。

### Step 3: Client Config & UI

1. **註冊遊戲**：在 `client/src/games/shared/gameConfig.ts` 新增遊戲設定 (顏色、Icon)。
2. **建立組件**：在 `client/src/games/` 建立對應資料夾。
3. **實作 Waiting Phase**：使用 `<GameLobby gameType="..." />`。
4. **實作 Main Game**：實作遊戲主畫面。
5. **實作 Game Over**：使用 `<GameOver gameType="..." />`。

---

## 🎨 遊戲模組化標準 (Client Standards)

為了保持體驗一致，請務必使用以下共用模組：

### 1. 遊戲設定 (`gameConfig.ts`)

所有遊戲的靜態設定都集中在這裡，包含顏色 (Morandi 色系)、Icon、規則說明。

```typescript
// client/src/games/shared/gameConfig.ts
export const GAME_CONFIG = {
  new_game: {
    icon: '🎲',
    name: '新遊戲',
    color: '#a8b5a0', // 請使用 Morandi 色系
    gradient: 'linear-gradient(...)',
    // ...
  },
};
```

### 2. 等待大廳 (`GameLobby`)

**不要**自己刻等待畫面。使用共用組件以確保 Header UI 和玩家列表樣式一致。

```tsx
// 你的遊戲主組件
if (phase === 'waiting') {
  return (
    <GameLobby
      gameType="new_game"
      players={players}
      isHost={isHost}
      onStartGame={handleStart}
      hostControls={/* 自定義設定 (如難度) */}
    />
  );
}
```

### 3. 遊戲結束 (`GameOver`)

**不要**自己刻結算畫面。使用共用組件以顯示統一的排行榜與冠軍展示。

```tsx
if (phase === 'game_over') {
  return (
    <GameOver gameType="new_game" players={players} winner={winner} onRestart={handleRestart}>
      {/* (可選) 插入遊戲專屬回顧內容 */}
    </GameOver>
  );
}
```

### 4. 視覺風格 (Morandi Theme)

- **顏色**：使用 `client/src/index.css` 定義的變數或 Morandi 色票。
- **圓角**：卡片與按鈕請使用大圓角 (Rounded-4 / Pill)。
- **陰影**：使用柔和陰影，避免純黑陰影。
- **背景**：保持 `Navbar` 和 `Lobby` 的背景風格一致。

---

### 5. 其他共用工具 (Shared Utils)

為加速開發，我們還提供了以下工具：

- **`<GameTimer>`**：統一的浮動倒數計時器。
  ```tsx
  <GameTimer timeLeft={60} phase="playing" />
  ```
- **`<GameLayout>`**：標準化的響應式版面（左側玩家列表 + 右側主畫面）。
  ```tsx
  <GameLayout
    sidebar={<PlayerList ... />}
    main={<Canvas ... />}
  />
  ```
- **`<PlayerAvatar>`**：統一的玩家頭像與狀態顯示。
  ```tsx
  <PlayerAvatar username="Rodney" score={100} isTurn={true} />
  ```

---

### 5. 其他共用工具 (Shared Utils)

為加速開發，我們還提供了以下工具：

- **`<GameTimer>`**：統一的浮動倒數計時器。
  ```tsx
  <GameTimer timeLeft={60} phase="playing" />
  ```
- **`<GameLayout>`**：標準化的響應式版面（左側玩家列表 + 右側主畫面）。
  ```tsx
  <GameLayout
    sidebar={<PlayerList ... />}
    main={<Canvas ... />}
  />
  ```
- **`<PlayerAvatar>`**：統一的玩家頭像與狀態顯示。
  ```tsx
  <PlayerAvatar username="Rodney" score={100} isTurn={true} />
  ```

---

## ✅ 提交前檢查清單 (Checklist)

- [ ] **Server**: 核心邏輯是否有 Unit Test 覆蓋？
- [ ] **Server**: 是否將狀態變更邏輯與 Socket 傳輸分離？
- [ ] **Client**: 是否在 `gameConfig.ts` 定義了設定？
- [ ] **Client**: 等待畫面是否使用了 `<GameLobby>`？
- [ ] **Client**: 結束畫面是否使用了 `<GameOver>`？
- [ ] **Client**: 是否善用 `<GameLayout>` 等共用組件？
- [ ] **Style**: 整體配色是否符合 Morandi 風格，且無突兀的高對比色？
