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
