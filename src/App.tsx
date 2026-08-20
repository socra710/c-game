import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { auth, db, firebaseEnabled, loginGuest, logoutGuest, saveLeaderboardEntry } from './firebase';
import { UPGRADES } from './game/constants';
import { buyUpgrade, clickCode, createGameState, getProductionPerSecond, type GameState } from './game/gameEngine';

const STORAGE_KEY = 'idle-coding-game-state';
const NAME_KEY = 'idle-coding-game-name';
const TEAM_KEY = 'idle-coding-game-team';
const LEADERBOARD_KEY = 'idle-coding-game-leaderboard';

const TEAM_OPTIONS = ['프론트엔드', '백엔드', 'AI/플랫폼', 'QA', '데이터', '운영'];

interface LeaderboardEntry {
  name: string;
  team: string;
  totalLines: number;
  updatedAt?: string;
}

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { name: '팀장', team: '운영', totalLines: 12540 },
  { name: '서버 개발자', team: '백엔드', totalLines: 8340 },
  { name: '프론트엔드', team: '프론트엔드', totalLines: 5920 },
  { name: 'QA', team: 'QA', totalLines: 4200 },
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

function loadPlayerName(): string {
  return localStorage.getItem(NAME_KEY) ?? '개발자';
}

function loadTeam(): string {
  const team = localStorage.getItem(TEAM_KEY) ?? '프론트엔드';
  return TEAM_OPTIONS.includes(team) ? team : '프론트엔드';
}

function getLeaderboardRows(name: string, team: string, score: number, remoteRows: LeaderboardEntry[]): LeaderboardEntry[] {
  const localRows = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) ?? '[]') as LeaderboardEntry[];
  const userRow = { name, team, totalLines: Math.max(0, Math.round(score)) };

  return [...DEFAULT_LEADERBOARD, ...localRows, ...remoteRows, userRow]
    .filter((entry) => entry && typeof entry.name === 'string' && typeof entry.totalLines === 'number')
    .sort((a, b) => b.totalLines - a.totalLines)
    .slice(0, 10);
}

function computeBadges(game: GameState, production: number): Array<{ id: string; label: string; description: string; unlocked: boolean }> {
  const upgradeCount = Object.values(game.upgrades).reduce((total, count) => total + count, 0);

  return [
    { id: 'first-click', label: '첫 커밋', description: '한 줄이라도 생산', unlocked: game.totalLines >= 1 },
    { id: 'startup', label: '초보 개발자', description: '100줄 달성', unlocked: game.totalLines >= 100 },
    { id: 'automation', label: '자동화', description: '초당 10줄 이상', unlocked: production >= 10 },
    { id: 'lead', label: '팀 리더', description: '업그레이드 3개 이상', unlocked: upgradeCount >= 3 },
    { id: 'ship-it', label: '배포 완료', description: '누적 10,000줄', unlocked: game.totalLines >= 10000 },
  ];
}

export default function App() {
  const [game, setGame] = useState<GameState>(() => loadInitialState());
  const [playerName, setPlayerName] = useState<string>(() => loadPlayerName());
  const [team, setTeam] = useState<string>(() => loadTeam());
  const [isGuest, setIsGuest] = useState(false);
  const [remoteRows, setRemoteRows] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  useEffect(() => {
    localStorage.setItem(NAME_KEY, playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem(TEAM_KEY, team);
  }, [team]);

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'leaderboard'), orderBy('totalLines', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRemoteRows(
        snapshot.docs.map((docSnapshot) => ({
          name: docSnapshot.data().name ?? 'Unknown',
          team: docSnapshot.data().team ?? '기타',
          totalLines: Number(docSnapshot.data().totalLines ?? 0),
          updatedAt: docSnapshot.data().updatedAt ?? '',
        })),
      );
    });

    return unsubscribe;
  }, []);

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
          await saveLeaderboardEntry(user.uid, playerName, game.totalLines, team);
        }
      } catch {
        setIsGuest(false);
      }
    };

    void sync();
  }, [playerName, team, game.totalLines]);

  useEffect(() => {
    const nextRows = getLeaderboardRows(playerName, team, game.totalLines, remoteRows);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(nextRows.slice(0, 5)));
  }, [playerName, team, game.totalLines, remoteRows]);

  const production = useMemo(() => getProductionPerSecond(game), [game]);
  const badges = useMemo(() => computeBadges(game, production), [game, production]);
  const leaderboardRows = useMemo(
    () => getLeaderboardRows(playerName, team, game.totalLines, remoteRows),
    [playerName, team, game.totalLines, remoteRows],
  );
  const totalText = `${game.totalLines.toFixed(0)}줄`;
  const currentRank = leaderboardRows.findIndex((entry) => entry.name === playerName && entry.team === team) + 1;
  const ownedUpgradeCount = Object.values(game.upgrades).reduce((total, count) => total + count, 0);
  const teamLeaderScore = useMemo(() => {
    const teams = new Map<string, number>();
    leaderboardRows.forEach((entry) => {
      teams.set(entry.team, (teams.get(entry.team) ?? 0) + entry.totalLines);
    });
    return [...teams.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [leaderboardRows]);

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
    await saveLeaderboardEntry(auth.currentUser.uid, playerName, game.totalLines, team);
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

          <label>
            팀
            <select value={team} onChange={(event) => setTeam(event.target.value)}>
              {TEAM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button className="ghost-button" onClick={handleLoginToggle}>
            {isGuest ? '로그아웃' : firebaseEnabled ? '게스트 로그인' : '로컬 모드'}
          </button>
          <button className="ghost-button" onClick={handleScoreSave}>
            순위 저장
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>총 코드</span>
            <strong>{totalText}</strong>
          </div>
          <div className="stat-card">
            <span>초당 생산</span>
            <strong>{production.toFixed(1)}줄</strong>
          </div>
          <div className="stat-card">
            <span>순위</span>
            <strong>#{currentRank || '-'}</strong>
          </div>
          <div className="stat-card">
            <span>팀 랭킹</span>
            <strong>{teamLeaderScore ? `${teamLeaderScore[0]} ${teamLeaderScore[1].toLocaleString()}줄` : '-'}</strong>
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
        <h2>업적</h2>
        <div className="badge-list">
          {badges.map((badge) => (
            <div key={badge.id} className={`badge ${badge.unlocked ? 'unlocked' : ''}`}>
              <div className="badge-mark">{badge.unlocked ? '✓' : '•'}</div>
              <div>
                <strong>{badge.label}</strong>
                <small>{badge.description}</small>
              </div>
            </div>
          ))}
        </div>
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
        <h2>팀별 랭킹</h2>
        <div className="team-summary">
          {[...new Set(leaderboardRows.map((entry) => entry.team))].map((teamName) => {
            const sum = leaderboardRows
              .filter((entry) => entry.team === teamName)
              .reduce((total, entry) => total + entry.totalLines, 0);
            return (
              <div key={teamName} className="team-row">
                <span>{teamName}</span>
                <strong>{sum.toLocaleString()}줄</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h2>리더보드</h2>
        <ol className="leaderboard">
          {leaderboardRows.map((entry, index) => (
            <li key={`${entry.name}-${entry.team}-${index}`}>
              <span>
                {index + 1}. {entry.name}
                <em> · {entry.team}</em>
              </span>
              <span>{entry.totalLines.toLocaleString()}줄</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
