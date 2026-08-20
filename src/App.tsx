import { useEffect, useMemo, useState } from 'react';
import { auth, firebaseEnabled, loginGuest, logoutGuest, saveLeaderboardEntry } from './firebase';
import { UPGRADES } from './game/constants';
import { buyUpgrade, clickCode, createGameState, getProductionPerSecond, type GameState } from './game/gameEngine';

const STORAGE_KEY = 'idle-coding-game-state';
const NAME_KEY = 'idle-coding-game-name';

interface LeaderboardEntry {
  name: string;
  totalLines: number;
}

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { name: '팀장', totalLines: 12540 },
  { name: '서버 개발자', totalLines: 8340 },
  { name: '프론트엔드', totalLines: 5920 },
  { name: 'QA', totalLines: 4200 },
];

function loadInitialState(): GameState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createGameState();

  try {
    return { ...createGameState(), ...JSON.parse(raw) };
  } catch {
    return createGameState();
  }
}

function loadName(): string {
  return localStorage.getItem(NAME_KEY) ?? '개발자';
}

function getLeaderboardRows(name: string, score: number): LeaderboardEntry[] {
  const localRows = JSON.parse(localStorage.getItem('idle-coding-game-leaderboard') ?? '[]') as LeaderboardEntry[];
  const userRow = { name, totalLines: Math.max(0, Math.round(score)) };

  return [...DEFAULT_LEADERBOARD, ...localRows, userRow]
    .sort((a, b) => b.totalLines - a.totalLines)
    .slice(0, 8);
}

export default function App() {
  const [game, setGame] = useState<GameState>(() => loadInitialState());
  const [playerName, setPlayerName] = useState<string>(() => loadName());
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  useEffect(() => {
    localStorage.setItem(NAME_KEY, playerName);
  }, [playerName]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setGame((prev) => {
        const gain = getProductionPerSecond(prev);
        if (gain <= 0) return prev;
        return {
          ...prev,
          totalLines: prev.totalLines + gain,
          currentLines: prev.currentLines + gain,
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setIsGuest(false);
      return;
    }

    const sync = async () => {
      try {
        const user = await loginGuest();
        setIsGuest(Boolean(user));
        if (user) {
          await saveLeaderboardEntry(user.uid, playerName, game.totalLines);
        }
      } catch {
        setIsGuest(false);
      }
    };

    void sync();
  }, [playerName, game.totalLines]);

  useEffect(() => {
    const leaderboard = getLeaderboardRows(playerName, game.totalLines);
    localStorage.setItem('idle-coding-game-leaderboard', JSON.stringify(leaderboard.slice(0, 5)));
  }, [playerName, game.totalLines]);

  const production = useMemo(() => getProductionPerSecond(game), [game]);
  const leaderboardRows = useMemo(() => getLeaderboardRows(playerName, game.totalLines), [playerName, game.totalLines]);
  const totalText = `${game.totalLines.toFixed(0)}줄`;

  const handleLoginToggle = async () => {
    if (!firebaseEnabled || !auth) {
      setIsGuest((prev) => !prev);
      return;
    }

    if (isGuest) {
      await logoutGuest();
      setIsGuest(false);
      return;
    }

    const user = await loginGuest();
    setIsGuest(Boolean(user));
  };

  const handleScoreSave = async () => {
    if (!firebaseEnabled || !auth?.currentUser) return;
    await saveLeaderboardEntry(auth.currentUser.uid, playerName, game.totalLines);
  };

  return (
    <main className="app-shell">
      <section className="panel hero">
        <p className="eyebrow">개발 회사 방치형 코딩 게임</p>
        <h1>방치형 코딩 게임</h1>

        <div className="player-bar">
          <label>
            닉네임
            <input
              aria-label="닉네임"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value || '개발자')}
            />
          </label>
          <button className="ghost-button" onClick={handleLoginToggle}>
            {isGuest ? '로그아웃' : firebaseEnabled ? '게스트 로그인' : '로컬 모드'}
          </button>
          <button className="ghost-button" onClick={handleScoreSave}>
            순위 저장
          </button>
        </div>

        <div className="score-row">
          <div>
            <span className="label">총 코드</span>
            <strong>{totalText}</strong>
          </div>
          <div>
            <span className="label">초당 생산</span>
            <strong>{production.toFixed(1)}줄</strong>
          </div>
        </div>

        <button
          className="primary-button"
          onClick={() => setGame((prev) => clickCode(prev))}
        >
          코드 생성
        </button>
      </section>

      <section className="panel">
        <h2>업그레이드</h2>
        <div className="upgrade-list">
          {UPGRADES.map((upgrade) => {
            const owned = game.upgrades[upgrade.id] ?? 0;
            const nextCost = upgrade.baseCost * (owned + 1);
            const canBuy = game.currentLines >= nextCost;

            return (
              <button
                key={upgrade.id}
                className="upgrade-button"
                disabled={!canBuy}
                onClick={() => setGame((prev) => buyUpgrade(prev, upgrade.id))}
              >
                <span>
                  <strong>{upgrade.name}</strong>
                  <small>{upgrade.description}</small>
                </span>
                <span>
                  {owned} 보유
                  <br />
                  {nextCost}줄
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>리더보드</h2>
        <ol className="leaderboard">
          {leaderboardRows.map((entry, index) => (
            <li key={`${entry.name}-${index}`}>
              <span>{index + 1}. {entry.name}</span>
              <span>{entry.totalLines.toLocaleString()}줄</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
