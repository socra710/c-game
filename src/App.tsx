import { useEffect, useMemo, useState } from 'react';
import { UPGRADES } from './game/constants';
import { buyUpgrade, clickCode, createGameState, getProductionPerSecond, type GameState } from './game/gameEngine';

const STORAGE_KEY = 'idle-coding-game-state';

function loadInitialState(): GameState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createGameState();

  try {
    return { ...createGameState(), ...JSON.parse(raw) };
  } catch {
    return createGameState();
  }
}

export default function App() {
  const [game, setGame] = useState<GameState>(() => loadInitialState());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

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

  const production = useMemo(() => getProductionPerSecond(game), [game]);
  const totalText = `${game.totalLines.toFixed(0)}줄`;

  return (
    <main className="app-shell">
      <section className="panel hero">
        <p className="eyebrow">개발 회사 방치형 코딩 게임</p>
        <h1>방치형 코딩 게임</h1>
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
          <li>
            <span>1. 팀장</span>
            <span>12,540줄</span>
          </li>
          <li>
            <span>2. 서버 개발자</span>
            <span>8,340줄</span>
          </li>
          <li>
            <span>3. 프론트엔드</span>
            <span>5,920줄</span>
          </li>
        </ol>
      </section>
    </main>
  );
}
