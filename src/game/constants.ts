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
