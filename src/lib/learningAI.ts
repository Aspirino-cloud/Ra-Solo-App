import { Player } from '../types';

export interface AIWeights {
  PHARAOH: number;
  GOD: number;
  CIVILIZATION: number;
  GOLD: number;
  MONUMENT: number;
  NILE: number;
}

const DEFAULT_WEIGHTS: AIWeights = {
  PHARAOH: 2,
  GOD: 2,
  CIVILIZATION: 2,
  GOLD: 3,
  MONUMENT: 1.5,
  NILE: 1
};

export function getAIWeights(): AIWeights {
  try {
    const data = localStorage.getItem('ra_ai_weights');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return { ...DEFAULT_WEIGHTS };
}

export function updateAIWeights(players: Player[]) {
  // Simple heuristic learning:
  // Observe the winner's composition. Slightly adjust weights towards what the winner emphasized.
  if (players.length === 0) return;
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  const wCounts = {
    PHARAOH: winner.tableau.filter(t => t.type === 'PHARAOH').length,
    GOD: winner.tableau.filter(t => t.type === 'GOD').length,
    CIVILIZATION: winner.tableau.filter(t => t.type === 'CIVILIZATION').length,
    GOLD: winner.tableau.filter(t => t.type === 'GOLD').length,
    MONUMENT: winner.tableau.filter(t => t.type === 'MONUMENT').length,
    NILE: winner.tableau.filter(t => t.type === 'NILE').length || winner.tableau.filter(t => t.type === 'FLOOD').length,
  };

  const totalTiles = Object.values(wCounts).reduce((a, b) => a + b, 0) || 1;

  let currentWeights = getAIWeights();
  
  // For each category, adjust slightly.
  // The normalized proportion of tiles of that type the winner had.
  // If the winner had 30% civs, maybe we bump the civ weight slightly.
  const learningRate = 0.1;

  const newWeights: AIWeights = {
    PHARAOH: currentWeights.PHARAOH * (1 - learningRate) + (wCounts.PHARAOH / totalTiles * 10) * learningRate,
    GOD: currentWeights.GOD * (1 - learningRate) + (wCounts.GOD / totalTiles * 10) * learningRate,
    CIVILIZATION: currentWeights.CIVILIZATION * (1 - learningRate) + (wCounts.CIVILIZATION / totalTiles * 10) * learningRate,
    GOLD: currentWeights.GOLD * (1 - learningRate) + (wCounts.GOLD / totalTiles * 10) * learningRate,
    MONUMENT: currentWeights.MONUMENT * (1 - learningRate) + (wCounts.MONUMENT / totalTiles * 10) * learningRate,
    NILE: currentWeights.NILE * (1 - learningRate) + (wCounts.NILE / totalTiles * 5) * learningRate,
  };
  
  // Keep boundaries
  Object.keys(newWeights).forEach(k => {
     const key = k as keyof AIWeights;
     newWeights[key] = Math.max(0.5, Math.min(newWeights[key], 5));
  });

  localStorage.setItem('ra_ai_weights', JSON.stringify(newWeights));
}
