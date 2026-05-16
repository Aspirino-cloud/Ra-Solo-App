import React from 'react';
import { GameAction } from './gameReducer';
import { Player, Sun, Tile, TileType, GameState, Difficulty } from '../types';
import { getTileValue } from './gameLogic';
import { getAIWeights } from './learningAI';

function getEvaluatedTileValue(tile: Tile, weights: any): number {
  if (['PHARAOH', 'GOD', 'CIVILIZATION', 'GOLD', 'MONUMENT', 'NILE'].includes(tile.type)) {
     const base = getTileValue(tile);
     return base * ((weights[tile.type] as number) || 1);
  }
  return getTileValue(tile);
}

export function computeAIAction(state: GameState, aiPlayerIndex: number): { action: GameAction | any, explanation: string } {
  const p = state.players[aiPlayerIndex];
  const difficulty = p.difficulty || 'medium';
  const weights = getAIWeights();
  
  const trkVal = state.auctionTrack.reduce((sum, t) => sum + getEvaluatedTileValue(t, weights), 0);
  let explanation = '';
  
  if (state.auctionTrack.length >= 8) {
    const gods = p.tableau.filter(t => t.type === 'GOD');
    if (gods.length > 0 && difficulty !== 'very_easy') {
      const bestTile = [...state.auctionTrack].sort((a, b) => getEvaluatedTileValue(b, weights) - getEvaluatedTileValue(a, weights))[0];
      explanation = `Leiste {${state.auctionTrack.length}/8} ist voll. Nutze Gott-Plättchen für ${bestTile.type}.`;
      return { action: { type: 'PLAY_GOD', payload: { godTileId: gods[0].id, targetTileId: bestTile.id } }, explanation };
    }
    explanation = `Leiste {${state.auctionTrack.length}/8} ist voll. Gezwungen RA zu rufen.`;
    return { action: { type: 'CALL_RA', payload: { forced: true } }, explanation };
  }
  
  let raThreshold = 6;
  if (difficulty === 'very_easy') raThreshold = 10;
  if (difficulty === 'easy') raThreshold = 8;
  if (difficulty === 'hard') raThreshold = 5;
  if (difficulty === 'expert') raThreshold = 4;

  if (trkVal > raThreshold && p.activeSuns.length > 0) {
    const rnd = Math.random();
    let riskTolerance = 0.5;
    if (difficulty === 'very_easy') riskTolerance = 0.8;
    if (difficulty === 'hard' || difficulty === 'expert') riskTolerance = 0.3;

    if (rnd > riskTolerance) {
      explanation = `[Gewichteter Leistenwert: ${trkVal.toFixed(1)}] übersteigt Schwellenwert (${raThreshold}) der Stufe ${difficulty}. Risiko für Plättchenverlust erkannt. Ruft RA.`;
      return { action: { type: 'CALL_RA', payload: { forced: false } }, explanation };
    }
  }
  
  explanation = `Zieht Plättchen. [Gewichteter Leistenwert: ${trkVal.toFixed(1)}] (Limit vor RA-Ruf in Stufe ${difficulty}: ${raThreshold}).`;
  return { action: { type: 'CHOOSE_DRAW' }, explanation };
}

export function computeAIBid(state: GameState, aiPlayerIndex: number): { sun: Sun | undefined, explanation: string } {
  const aiLineUp = state.players[aiPlayerIndex];
  const difficulty = aiLineUp.difficulty || 'medium';
  const weights = getAIWeights();
  
  const trkVal = state.auctionTrack.reduce((sum, t) => sum + getEvaluatedTileValue(t, weights), 0);
  const highest = state.highestBid || 0;
  
  const affordable = aiLineUp.activeSuns.filter(s => s > highest).sort((a,b)=>a-b);
  if (affordable.length === 0) {
    return { sun: undefined, explanation: `Hat keine höheren Sonnen verfügbar, um ${highest} zu überbieten. Passt.` };
  }
  
  const isForced = state.biddingReason === 'called_ra_forced' 
                   && state.raCallerIndex === aiPlayerIndex
                   && state.highestBid === undefined;

  if (isForced) {
    return { sun: affordable[0], explanation: `Muss bieten (Ra gezwungen), nutzt niedrigste mögliche Sonne: ${affordable[0]}.` };
  }

  if (trkVal < 2 && difficulty !== 'very_easy') {
     return { sun: undefined, explanation: `Leistenwert (${trkVal.toFixed(1)}) ist es nicht wert. Passt.` };
  }

  let chosenSun = affordable[0];
  
  if (difficulty === 'very_easy') {
     if (Math.random() > 0.5) return { sun: chosenSun, explanation: `(Sehr Einfach): Willkürliches niedriges Gebot (${chosenSun}).` };
     return { sun: undefined, explanation: `(Sehr Einfach): Willkürlich gepasst.` };
  }

  if (difficulty === 'hard' || difficulty === 'expert') {
     const optimalSun = affordable.find(s => s >= trkVal || Math.abs(s - trkVal) < 3);
     if (optimalSun) chosenSun = optimalSun;

     if (difficulty === 'expert') {
         if (state.centerSun > 8 && (chosenSun / trkVal < 2)) {
             chosenSun = affordable[affordable.length - 1]; // highest!
             return { sun: chosenSun, explanation: `(Experte): Bietet bewusst höchste Sonne (${chosenSun}), um strategisch die wertvolle Sonnen-Rendite aus der Mitte (${state.centerSun}) zu blockieren und den Tisch zu sichern.` };
         }
     }
  }

  const multiplier = (difficulty === 'expert' || difficulty === 'hard') ? 1.5 : 3;
  if (chosenSun > trkVal * multiplier) {
    return { sun: undefined, explanation: `Niedrigste verfügbare Sieger-Sonne (${chosenSun}) ist mir im Vergleich zum Leistenwert (${trkVal.toFixed(1)}) zu teuer. Passt.` };
  }
  
  return { sun: chosenSun, explanation: `Erachte Leistenwert (${trkVal.toFixed(1)}) als lukrativ für die Investition der ${chosenSun}-Sonne.` };
}

export function computeAIDisasterDiscards(player: Player, disaster: { disasterType: TileType, count: number }): string[] {
   let targets: Tile[] = [];
   if (disaster.disasterType === 'BURIAL') {
      targets = player.tableau.filter(t => t.type === 'PHARAOH');
   } else if (disaster.disasterType === 'DROUGHT') {
     const floods = player.tableau.filter(t => t.type === 'FLOOD');
     const niles = player.tableau.filter(t => t.type === 'NILE');
     targets = [...floods, ...niles];
   } else if (disaster.disasterType === 'UNREST') {
      targets = player.tableau.filter(t => t.type === 'CIVILIZATION');
   } else if (disaster.disasterType === 'EARTHQUAKE') {
      targets = player.tableau.filter(t => t.type === 'MONUMENT');
   }

   return targets.slice(0, 2).map(t => t.id);
}
