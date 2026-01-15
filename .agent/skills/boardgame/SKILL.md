---
name: BoardGameDev
description: Expert Full-Stack Game Developer skill for BoardGame Hub ("萬遊引力"), specializing in Clean Architecture, DDD, and React 18.
---

# BoardGame Developer Skill

You are an expert Full-Stack Game Developer specializing in Clean Architecture, DDD, and React.
This project is a Board Game Platform ("萬遊引力") built with a strict adherence to specific architectural and stylistic rules.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Bootstrap 5.3.
- **Backend**: Node.js, Socket.IO.
- **Languages**: TypeScript (Strict).
- **Styling**: **Morandi Theme** (CSS Variables).
  - ❌ **NO Tailwind CSS**.
  - ✅ Use `Bootstrap 5` classes + Custom CSS Variables.

## 🧱 Key Architecture Rules

### 1. Domain-Driven Design (DDD)

- **Separation of Concerns**:
  - Server logic **MUST** live in `server/src/games/<game>/domain.ts` (Pure TypeScript, no IO).
  - **No Logic in Sockets**: `SocketHandler` classes MUST ONLY handle communication (`emit`/`on`). NEVER write business logic (state changes, scoring) inside socket handlers.
- **TDD First**: Write unit tests for `domain.ts` logic **BEFORE** implementing infrastructure or UI.

### 2. shared UI Modules (Reusability)

Do not create your own components if a shared one exists. usage is **MANDATORY**.

| Component          | Path                                       | Purpose                                          |
| :----------------- | :----------------------------------------- | :----------------------------------------------- |
| `<GameLobby />`    | `client/src/games/shared/GameLobby.tsx`    | Standard waiting room with player list/settings. |
| `<GameOver />`     | `client/src/games/shared/GameOver.tsx`     | Standard results/leaderboard.                    |
| `<GameTimer />`    | `client/src/games/shared/GameTimer.tsx`    | Standard floating countdown.                     |
| `<GameLayout />`   | `client/src/games/shared/GameLayout.tsx`   | Responsive sidebar + main area.                  |
| `<PlayerAvatar />` | `client/src/games/shared/PlayerAvatar.tsx` | Standard player display.                         |

**Configuration**: Register new games in `client/src/games/shared/gameConfig.ts`.

### 3. Visual Guidelines (Morandi Theme)

Use the defined CSS variables from `client/src/index.css`.

**Color Palette**:

- `var(--morandi-sage)` (#a8b5a0) - Success/Green
- `var(--morandi-rose)` (#c9a9a6) - Accent/Red
- `var(--morandi-blue)` (#9fb4c7) - Primary/Info
- `var(--morandi-lavender)` (#b5a7c4) - Secondary
- `var(--morandi-sand)` (#d4c5b5) - Warning
- `var(--morandi-cream)` (#f5f0eb) - Backgrounds
- `var(--morandi-coffee)` / `var(--morandi-brown)` (#a39080) - Earth Tones

**Design Specs**:

- **Background**: Wood Texture (`wood-pattern.svg`) over coffee/brown base.
- **Buttons**: Soft rounded (`border-radius: 12px`).
- **Cards**: Minimal, Clean (`border-radius: 16px`), `var(--card-bg)`.
- **Forms**: Rounded corners (`rounded-4`), soft borders.

### 4. State Management

- **Server Authoritative**: Client logic is "dumb" and only renders `gameState` received from Server.
- **Optimistic UI**: Allowed only for simple interactions (e.g., card selection highlight) but must sync with server state.

## 🚀 Game Development Workflow

When asked to create or modify a game, follow this **EXACT** process:

### Step 1: Server Domain (TDD)

1.  Create/Edit `server/src/games/<game>/domain.ts`.
2.  Define `GameState`, `Player`, `Round` interfaces.
3.  Write/Update tests in `server/src/__tests__/<game>.test.ts`.
4.  Implement pure logic (start game, play move, calculate score) until tests pass.

### Step 2: Server Infrastructure

1.  Create/Edit `server/src/games/<game>/index.ts` implementing `GameModule`.
2.  Bind `socket.on` events to your Domain functions.
3.  Emit updated `gameState` to room.

### Step 3: Client UI

1.  Register game in `client/src/games/shared/gameConfig.ts`.
2.  Create/Edit `client/src/games/<game>/<GameName>.tsx`.
3.  Use `<GameLobby>` for `waiting` phase.
4.  Use `<GameLayout>` + `<GameTimer>` for `playing` phase.
5.  Use `<GameOver>` for `game_over` phase.

### Step 4: Verification & Polish

1.  Run **Linting**: `npm run lint` (in `client/`).
2.  Run **Tests**: `npm test` (in `server/`).
3.  Ensure no console warnings in browser.

## 📂 File Structure Highlights

- `client/src/games/shared/`: Core reusable components.
- `server/src/games/<game_name>/domain.ts`: Pure game logic (Test this!).
- `DEVELOPMENT_GUIDE.md`: Context for human developers.
