# 방치형 코딩 게임 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 개발 회사 직원이 함께 플레이하는 방치형 코딩 게임 MVP를 만들고 GitHub Pages로 자동 배포한다.

**Architecture:** React + Vite 기반 SPA를 만들고 Firebase Auth/Firestore로 인증과 리더보드를 처리한다. 로컬 상태와 서버 상태를 분리해 실시간 게임 루프를 유지하고, GitHub Actions로 배포를 자동화한다.

**Tech Stack:** React, Vite, TypeScript, Firebase Auth, Firestore, Vitest, GitHub Actions, GitHub Pages

---

### Task 1: 프로젝트 초기화 및 개발 환경 구성

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`
- Create: `src/styles.css`
- Create: `tests/setup.ts`

- [ ] **Step 1: Create the Vite React TypeScript app skeleton**

```bash
npm create vite@latest . -- --template react-ts
npm install
```

Expected: project scaffolding created without errors.

- [ ] **Step 2: Install core dependencies**

```bash
npm install firebase
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Expected: package.json includes Firebase and test tooling.

- [ ] **Step 3: Configure the test runner**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    globals: true,
  },
});
```

- [ ] **Step 4: Add package scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 5: Run initial validation**

Run: `npm run test -- --run`  
Expected: PASS with no tests yet, or a minimal smoke test passes.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: initialize react game app"
```

---

### Task 2: 게임 데이터 모델과 업그레이드 상수 정의

**Files:**
- Create: `src/game/constants.ts`
- Create: `src/game/types.ts`
- Test: `tests/game/constants.test.ts`

- [ ] **Step 1: Write the failing test for upgrade definitions**

```ts
import { describe, expect, it } from 'vitest';
import { UPGRADES, CLICK_POWER } from '../src/game/constants';

describe('game constants', () => {
  it('includes a starter upgrade and a valid click power', () => {
    expect(UPGRADES.length).toBeGreaterThan(0);
    expect(CLICK_POWER).toBeGreaterThan(0);
    expect(UPGRADES[0].id).toBe('junior_dev');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/game/constants.test.ts`  
Expected: FAIL because `src/game/constants.ts` does not exist.

- [ ] **Step 3: Implement the constants module**

```ts
export type UpgradeId = 'junior_dev' | 'senior_dev' | 'tech_lead' | 'ai_assistant' | 'copilot_pro' | 'full_autopilot';

export interface Upgrade {
  id: UpgradeId;
  name: string;
  baseCost: number;
  baseProduction: number;
  description: string;
}

export const CLICK_POWER = 1;

export const UPGRADES: Upgrade[] = [
  { id: 'junior_dev', name: 'Junior Dev', baseCost: 10, baseProduction: 0.1, description: '작은 코딩 속도 개선' },
  { id: 'senior_dev', name: 'Senior Dev', baseCost: 100, baseProduction: 1, description: '리뷰와 개선 속도 향상' },
  { id: 'tech_lead', name: 'Tech Lead', baseCost: 500, baseProduction: 5, description: '설계와 퀄리티 향상' },
  { id: 'ai_assistant', name: 'AI Assistant', baseCost: 2000, baseProduction: 20, description: '자동 코드 보조' },
  { id: 'copilot_pro', name: 'Copilot Pro', baseCost: 10000, baseProduction: 100, description: '개발 속도 급상승' },
  { id: 'full_autopilot', name: 'Full Autopilot', baseCost: 50000, baseProduction: 500, description: '완전 자동화' },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/game/constants.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/constants.ts tests/game/constants.test.ts
git commit -m "feat: add game upgrade constants"
```

---

### Task 3: 게임 로직 구현 (클릭, 자동생산, 업그레이드 구매)

**Files:**
- Create: `src/game/gameEngine.ts`
- Test: `tests/game/gameEngine.test.ts`

- [ ] **Step 1: Write failing tests for core game behavior**

```ts
import { describe, expect, it } from 'vitest';
import { createGameState, clickCode, buyUpgrade, getProductionPerSecond } from '../src/game/gameEngine';

describe('game engine', () => {
  it('adds click power to total lines', () => {
    const state = createGameState();
    const next = clickCode(state);
    expect(next.totalLines).toBeGreaterThan(state.totalLines);
  });

  it('buys an upgrade with enough currency', () => {
    const state = createGameState({ totalLines: 100, upgrades: { junior_dev: 0 } });
    const next = buyUpgrade(state, 'junior_dev');
    expect(next.upgrades.junior_dev).toBe(1);
    expect(next.totalLines).toBeLessThan(100);
  });

  it('calculates production from owned upgrades', () => {
    const state = createGameState({ upgrades: { junior_dev: 2, senior_dev: 1 } });
    expect(getProductionPerSecond(state)).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/game/gameEngine.test.ts`  
Expected: FAIL because gameEngine.ts is missing.

- [ ] **Step 3: Implement minimal game engine**

```ts
import { CLICK_POWER, UPGRADES, type UpgradeId } from './constants';

export interface GameState {
  totalLines: number;
  currentLines: number;
  upgrades: Record<string, number>;
}

export function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    totalLines: 0,
    currentLines: 0,
    upgrades: {},
    ...overrides,
  };
}

export function clickCode(state: GameState): GameState {
  return {
    ...state,
    totalLines: state.totalLines + CLICK_POWER,
    currentLines: state.currentLines + CLICK_POWER,
  };
}

export function getProductionPerSecond(state: GameState): number {
  return UPGRADES.reduce((sum, upgrade) => {
    const count = state.upgrades[upgrade.id] ?? 0;
    return sum + count * upgrade.baseProduction;
  }, 0);
}

export function buyUpgrade(state: GameState, upgradeId: UpgradeId): GameState {
  const upgrade = UPGRADES.find((entry) => entry.id === upgradeId);
  if (!upgrade) return state;

  const nextCount = (state.upgrades[upgradeId] ?? 0) + 1;
  const cost = upgrade.baseCost * nextCount;

  if (state.currentLines < cost) {
    return state;
  }

  return {
    ...state,
    currentLines: state.currentLines - cost,
    upgrades: {
      ...state.upgrades,
      [upgradeId]: nextCount,
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- tests/game/gameEngine.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/gameEngine.ts tests/game/gameEngine.test.ts
git commit -m "feat: implement idle game mechanics"
```

---

### Task 4: React UI 구성 — 클릭 버튼, 업그레이드 패널, 점수 표시

**Files:**
- Create: `src/components/ClickButton.tsx`
- Create: `src/components/UpgradePanel.tsx`
- Create: `src/components/ScoreBoard.tsx`
- Modify: `src/App.tsx`
- Test: `tests/App.test.tsx`

- [ ] **Step 1: Write failing UI smoke test**

```tsx
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App', () => {
  it('renders the game title and main button', () => {
    render(<App />);
    expect(screen.getByText(/방치형 코딩 게임/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /코드 생성/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/App.test.tsx`  
Expected: FAIL because app content is not implemented.

- [ ] **Step 3: Implement the main app shell**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { UPGRADES, CLICK_POWER } from './game/constants';
import { buyUpgrade, clickCode, createGameState, getProductionPerSecond } from './game/gameEngine';

export default function App() {
  const [game, setGame] = useState(() => createGameState());

  useEffect(() => {
    const timer = setInterval(() => {
      setGame((prev) => ({
        ...prev,
        totalLines: prev.totalLines + getProductionPerSecond(prev),
        currentLines: prev.currentLines + getProductionPerSecond(prev),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const scoreText = useMemo(() => `총 ${game.totalLines.toFixed(0)}줄`, [game.totalLines]);

  return (
    <main>
      <h1>방치형 코딩 게임</h1>
      <p>{scoreText}</p>
      <button onClick={() => setGame((prev) => clickCode(prev))}>코드 생성</button>
      <section>
        {UPGRADES.map((upgrade) => (
          <button
            key={upgrade.id}
            onClick={() => setGame((prev) => buyUpgrade(prev, upgrade.id))}
          >
            {upgrade.name}
          </button>
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/App.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components tests/App.test.tsx
git commit -m "feat: add main game UI"
```

---

### Task 5: Firebase 인증 및 Firestore 연결

**Files:**
- Create: `src/firebase/config.ts`
- Create: `src/firebase/auth.ts`
- Create: `src/firebase/db.ts`
- Create: `src/hooks/useAuth.ts`
- Create: `src/hooks/useLeaderboard.ts`

- [ ] **Step 1: Add Firebase config template**

```ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

- [ ] **Step 2: Implement email login and anonymous guest fallback**

```ts
import { signInAnonymously, signOut } from 'firebase/auth';
import { auth } from './config';

export async function loginGuest() {
  return signInAnonymously(auth);
}

export async function logout() {
  return signOut(auth);
}
```

- [ ] **Step 3: Implement leaderboard save/load functions**

```ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';

export async function saveUserProgress(uid: string, payload: Record<string, unknown>) {
  await setDoc(doc(db, 'users', uid), payload, { merge: true });
}

export async function loadUserProgress(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}
```

- [ ] **Step 4: Add auth integration smoke tests**

Run: `npm run test -- --run`  
Expected: runtime modules load without TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/firebase src/hooks
git commit -m "feat: add firebase auth and firestore storage"
```

---

### Task 6: 리더보드 실시간 동기화 및 화면 표시

**Files:**
- Create: `src/components/Leaderboard.tsx`
- Create: `src/hooks/useLeaderboard.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing leaderboard test**

```tsx
import { render, screen } from '@testing-library/react';
import { Leaderboard } from '../src/components/Leaderboard';

describe('Leaderboard', () => {
  it('renders leaderboard title', () => {
    render(<Leaderboard rows={[{ name: 'Alice', totalLines: 100 }]} />);
    expect(screen.getByText(/리더보드/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/Leaderboard.test.tsx`  
Expected: FAIL because component is not defined.

- [ ] **Step 3: Implement leaderboard component**

```tsx
interface LeaderRow {
  name: string;
  totalLines: number;
}

export function Leaderboard({ rows }: { rows: LeaderRow[] }) {
  return (
    <section>
      <h2>리더보드</h2>
      <ol>
        {rows.map((row, index) => (
          <li key={`${row.name}-${index}`}>
            {index + 1}. {row.name} - {row.totalLines}줄
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/Leaderboard.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Leaderboard.tsx src/hooks/useLeaderboard.ts src/App.tsx
git commit -m "feat: add leaderboard display"
```

---

### Task 7: GitHub Pages 자동 배포 설정

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Add deployment script**

```json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```

- [ ] **Step 2: Add GitHub Actions workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- [ ] **Step 3: Validate build locally**

Run: `npm run build`  
Expected: production bundle generated in `dist/`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml package.json .env.example
git commit -m "ci: add github pages deployment"
```

---

### Task 8: 문서화 및 운영 체크리스트

**Files:**
- Create: `README.md` (overwrite project README with game setup instructions)
- Create: `docs/DEPLOYMENT.md`

- [ ] **Step 1: Write setup instructions**

```md
# 방치형 코딩 게임

## 로컬 실행

1. `npm install`
2. `.env.example`를 복사해 `.env.local` 생성
3. Firebase 설정 값 입력
4. `npm run dev`
```

- [ ] **Step 2: Document deployment steps**

```md
## 배포

- GitHub 저장소에 Firebase 환경 변수를 설정
- `main` 브랜치 푸시 시 GitHub Actions가 자동으로 배포
- 배포 URL: `https://<username>.github.io/c-game/`
```

- [ ] **Step 3: Commit**

```bash
git add README.md docs/DEPLOYMENT.md
git commit -m "docs: add setup and deployment guide"
```

---

## Verification Summary

At the end of implementation, verify the following:

- `npm run test` passes for the game logic and UI smoke checks.
- `npm run build` succeeds without TypeScript or bundling errors.
- `main` branch push triggers a working GitHub Pages deploy.
- Firebase config works without runtime crashes in the browser.
- Leaderboard displays top players in sorted order.

---

## Risk and Mitigations

- **Firebase quota limits**: start with anonymous auth and minimal daily writes; use local caching to reduce writes.
- **Game abuse**: trust the client only for UX, not for authoritative scoring; treat Firestore values as server-side storage for the leaderboard.
- **GitHub Pages limitations**: static hosting supports the MVP; if real authentication or server logic becomes necessary, revisit to Vercel/Supabase.
