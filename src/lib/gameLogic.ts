import { GameState, Player, Sun, Tile, TileType } from '../types';

export function getMaxRa(playerCount: number): number {
  switch(playerCount) {
    case 2: return 6;
    case 3: return 8;
    case 4: return 9;
    case 5: return 10;
    default: return 8;
  }
}

export function getNextActivePlayer(players: Player[], startIdx: number): number {
  for (let i = 1; i <= players.length; i++) {
    const idx = (startIdx + i) % players.length;
    if (players[idx].activeSuns.length > 0) return idx;
  }
  return -1;
}

export function getTileValue(tile: Tile): number {
  switch (tile.type) {
    case 'RA': return 0;
    case 'GOD': return 2;
    case 'PHARAOH': return 2;
    case 'CIVILIZATION': return 2;
    case 'GOLD': return 3;
    case 'MONUMENT': return 1.5;
    case 'NILE': 
    case 'FLOOD': return 1;
    case 'BURIAL':
    case 'UNREST': return -3;
    case 'DROUGHT': return -2;
    case 'EARTHQUAKE': return -3;
  }
}

export function addLog(state: GameState, msg: string): GameState {
  return { ...state, logs: [...state.logs.slice(-19), msg] };
}

export function calculateEpochScores(players: Player[]): Player[] {
  let newPlayers = [...players];
  
  const pharaohCounts = newPlayers.map(p => p.tableau.filter(t => t.type === 'PHARAOH').length);
  const maxPharaohs = Math.max(...pharaohCounts);
  const minPharaohs = Math.min(...pharaohCounts);
  
  newPlayers = newPlayers.map((p, i) => {
    let scoreDelta = 0;
    
    // Gods
    const gods = p.tableau.filter(t => t.type === 'GOD').length;
    scoreDelta += gods * 2;
    
    // Pharaohs (must be > 0 to count for max, and tie logic applies)
    if (pharaohCounts[i] === maxPharaohs && maxPharaohs > 0) scoreDelta += 5;
    // For min pharaohs, zero is possible. Only lose if someone else has more!
    if (maxPharaohs !== minPharaohs && pharaohCounts[i] === minPharaohs) scoreDelta -= 2;
    
    // Nile/Flood
    const floods = p.tableau.filter(t => t.type === 'FLOOD').length;
    const niles = p.tableau.filter(t => t.type === 'NILE').length;
    if (floods > 0) scoreDelta += (floods + niles);
    
    // Civilizations
    const civs = p.tableau.filter(t => t.type === 'CIVILIZATION');
    const uniqueCivs = new Set(civs.map(c => c.subtype)).size;
    if (uniqueCivs === 0) scoreDelta -= 5;
    else if (uniqueCivs === 3) scoreDelta += 5;
    else if (uniqueCivs === 4) scoreDelta += 10;
    else if (uniqueCivs === 5) scoreDelta += 15;
    
    // Gold
    const gold = p.tableau.filter(t => t.type === 'GOLD').length;
    scoreDelta += gold * 3;
    
    // Clean up tableau
    const nextTableau = p.tableau.filter(t => ['PHARAOH', 'NILE', 'MONUMENT'].includes(t.type));
    
    return { ...p, score: Math.max(0, p.score + scoreDelta), tableau: nextTableau };
  });
  
  return newPlayers;
}

export function calculateFinalScores(players: Player[]): Player[] {
  let newPlayers = [...players];
  
  const sunSums = newPlayers.map(p => [...p.activeSuns, ...p.inactiveSuns].reduce((a, b) => a + b, 0));
  const maxSum = Math.max(...sunSums);
  const minSum = Math.min(...sunSums);
  
  newPlayers = newPlayers.map((p, i) => {
    let scoreDelta = 0;
    
    // Suns
    if (sunSums[i] === maxSum && maxSum !== minSum) scoreDelta += 5;
    if (sunSums[i] === minSum && maxSum !== minSum) scoreDelta -= 5;
    
    // Monuments (only at the end)
    const monuments = p.tableau.filter(t => t.type === 'MONUMENT');
    const typeCounts: Record<string, number> = {};
    for (const m of monuments) {
       typeCounts[m.subtype!] = (typeCounts[m.subtype!] || 0) + 1;
    }
    const uniqueMons = Object.keys(typeCounts).length;
    // unique mon scoring
    const uniqueScores = [0, 1, 2, 3, 4, 5, 6, 10, 15];
    scoreDelta += uniqueScores[uniqueMons] || 0;
    
    // identical mon scoring
    for (const count of Object.values(typeCounts)) {
       if (count === 3) scoreDelta += 5;
       else if (count === 4) scoreDelta += 10;
       else if (count >= 5) scoreDelta += 15;
    }
    
    return { ...p, score: Math.max(0, p.score + scoreDelta) };
  });
  
  return newPlayers;
}
