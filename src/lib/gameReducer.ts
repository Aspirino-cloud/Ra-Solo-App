import { GameState, Player, Sun, Tile, TileType, GamePhase } from '../types';
import { getNextActivePlayer, getMaxRa, addLog, calculateEpochScores, calculateFinalScores } from './gameLogic';

export type GameAction = 
  | { type: 'START_GAME'; payload: GameState }
  | { type: 'CHOOSE_DRAW'; explanation?: string }
  | { type: 'TILE_DRAWN'; payload: Tile; explanation?: string }
  | { type: 'CALL_RA'; payload: { forced: boolean }; explanation?: string }
  | { type: 'PLAY_GOD'; payload: { godTileId: string, targetTileId: string }; explanation?: string }
  | { type: 'PLACE_BID'; payload: { sun?: Sun }; explanation?: string }
  | { type: 'ACKNOWLEDGE_AUCTION_RESULT'; explanation?: string }
  | { type: 'DISASTER_RESOLVED'; payload: { discardedTileIds: string[] }; explanation?: string }
  | { type: 'NEXT_EPOCH'; explanation?: string };

export function gameReducer(state: GameState, action: GameAction): GameState {
   if (action.type === 'START_GAME') {
      return action.payload;
   }

   let explanation = (action as any).explanation;
   let actionMsg = '';

   if (action.type !== 'NEXT_EPOCH') {
      const actorIndex = (action.type === 'PLACE_BID' && state.phase === 'bidding') 
         ? state.biddingOrder[state.currentBidderPos]
         : (action.type === 'DISASTER_RESOLVED' && state.phase === 'disaster_resolution' && state.disasterQueue.length > 0)
         ? state.disasterQueue[0].playerIndex
         : state.currentPlayerIndex;
      
      const curPlayer = state.players[actorIndex];
      let actStr: string = action.type;
      if (action.type === 'PLACE_BID') actStr = `Bietet ${(action as any).payload.sun || 'Pass'}`;
      if (action.type === 'TILE_DRAWN') actStr = `Zieht Plättchen ${(action as any).payload.type}`;
      if (action.type === 'CALL_RA') actStr = `Ruft RA`;
      actionMsg = `[${curPlayer?.name}] ${actStr}`;
   }

   // create a state snapshot without the replay array to save memory
   const { replay, ...snapshot } = state; 
   let nextState = internalGameReducer(state, action);
   
   if (action.type !== 'NEXT_EPOCH') {
       nextState = {
          ...nextState,
          replay: [...state.replay, {
              message: actionMsg,
              explanation: explanation,
              stateSnapshot: JSON.parse(JSON.stringify(snapshot))
          }]
       };
   }

   return nextState;
}

function endEpoch(state: GameState): GameState {
   let newState = addLog(state, `Epoche ${state.epoch} beendet!`);
   const newPlayers = calculateEpochScores(newState.players);
   
   if (state.epoch === 3) {
      const finalPlayers = calculateFinalScores(newPlayers);
      return { ...newState, players: finalPlayers, phase: 'game_over' };
   }

   // Prepare next epoch
   const sortedByHighestSun = [...newPlayers].sort((a, b) => Math.max(...b.activeSuns, ...b.inactiveSuns) - Math.max(...a.activeSuns, ...a.inactiveSuns));
   const startingPlayerId = sortedByHighestSun[0].id;
   const startingIndex = newPlayers.findIndex(p => p.id === startingPlayerId);

   const resetPlayers = newPlayers.map(p => ({
     ...p, 
     activeSuns: [...p.activeSuns, ...p.inactiveSuns].sort((a,b)=>a-b),
     inactiveSuns: []
   }));

   return {
      ...newState,
      epoch: state.epoch + 1,
      players: resetPlayers,
      auctionTrack: [],
      raTrack: 0,
      phase: 'epoch_end',
      currentPlayerIndex: startingIndex
   };
}

function internalGameReducer(state: GameState, action: GameAction): GameState {
   switch (action.type) {
     case 'START_GAME':
        return action.payload;

     case 'CHOOSE_DRAW':
        return { ...state, phase: 'waiting_for_drawn_tile' };

     case 'TILE_DRAWN': {
        const tile = action.payload;
        let newState = addLog(state, `${state.players[state.currentPlayerIndex].name} zieht: ${tile.type}`);

        if (tile.type === 'RA') {
           const newRaCount = state.raTrack + 1;
           const maxRa = getMaxRa(state.players.length);
           if (newRaCount >= maxRa) {
              return endEpoch({ ...newState, raTrack: newRaCount, auctionTrack: [] });
           } else {
              // start bidding
              const participants = [];
              const starter = state.currentPlayerIndex;
              for (let i = 1; i <= state.players.length; i++) {
                 const idx = (starter + i) % state.players.length;
                 if (newState.players[idx].activeSuns.length > 0) participants.push(idx);
              }
              if (participants.length === 0) {
                 return { ...newState, raTrack: newRaCount };
              }
              return {
                 ...newState,
                 raTrack: newRaCount,
                 phase: 'bidding',
                 biddingReason: 'drawn_ra',
                 raCallerIndex: starter,
                 biddingOrder: participants,
                 currentBidderPos: 0,
                 highestBid: undefined,
                 highestBidderIndex: undefined
              };
           }
        } else {
           const newTrack = [...newState.auctionTrack, tile];
           let nextPlayer = getNextActivePlayer(newState.players, state.currentPlayerIndex);
           if (nextPlayer === -1) {
              return endEpoch({ ...newState, auctionTrack: newTrack });
           }
           return { ...newState, auctionTrack: newTrack, currentPlayerIndex: nextPlayer, phase: 'action_select' };
        }
     }

     case 'CALL_RA': {
        const participants = [];
        const starter = state.currentPlayerIndex;
        for (let i = 1; i <= state.players.length; i++) {
           const idx = (starter + i) % state.players.length;
           if (state.players[idx].activeSuns.length > 0) participants.push(idx);
        }
        const reason = action.payload.forced ? 'called_ra_forced' : 'called_ra_voluntary';
        let s = addLog(state, `${state.players[state.currentPlayerIndex].name} ruft RA an!`);
        return {
           ...s,
           phase: 'bidding',
           biddingReason: reason,
           raCallerIndex: starter,
           biddingOrder: participants,
           currentBidderPos: 0,
           highestBid: undefined,
           highestBidderIndex: undefined
        };
     }

     case 'PLACE_BID': {
        const bid = action.payload.sun;
        const bidderIndex = state.biddingOrder[state.currentBidderPos];
        let newState = { ...state };
        
        if (bid !== undefined) {
           newState.highestBid = bid;
           newState.highestBidderIndex = bidderIndex;
           newState = addLog(newState, `${state.players[bidderIndex].name} bietet ${bid}.`);
        } else {
           newState = addLog(newState, `${state.players[bidderIndex].name} passt.`);
        }

        const nextBidderPos = state.currentBidderPos + 1;
        if (nextBidderPos >= state.biddingOrder.length) {
           // Bidding over
           return resolveAuction(newState);
        } else {
           return { ...newState, currentBidderPos: nextBidderPos };
        }
     }

     case 'DISASTER_RESOLVED': {
        const dq = state.disasterQueue[0];
        const pIdx = dq.playerIndex;
        const player = state.players[pIdx];
        
        const newTableau = player.tableau.filter(t => !action.payload.discardedTileIds.includes(t.id));
        const newPlayers = [...state.players];
        newPlayers[pIdx] = { ...player, tableau: newTableau };
        
        const newDq = state.disasterQueue.slice(1);
        let phase = state.phase;
        let nextP = state.currentPlayerIndex;
        if (newDq.length === 0) {
           nextP = getNextActivePlayer(newPlayers, state.raCallerIndex!);
           if (nextP === -1) return endEpoch({ ...state, players: newPlayers, disasterQueue: [], phase: 'action_select' });
           phase = 'action_select';
        }

        return { ...state, players: newPlayers, disasterQueue: newDq, phase, currentPlayerIndex: nextP };
     }

     case 'PLAY_GOD': {
        const p = state.players[state.currentPlayerIndex];
        const godTile = p.tableau.find(t => t.id === action.payload.godTileId);
        const targetTile = state.auctionTrack.find(t => t.id === action.payload.targetTileId);
        
        if (!godTile || !targetTile) return state;

        const newTableau = p.tableau.filter(t => t.id !== godTile.id).concat([targetTile]);
        const newPlayers = [...state.players];
        newPlayers[state.currentPlayerIndex] = { ...p, tableau: newTableau };

        const newAuctionTrack = state.auctionTrack.filter(t => t.id !== targetTile.id);
        
        let s = addLog(state, `${p.name} nutzt Gott-Plättchen für ${targetTile.type}.`);
        
        // After playing God, their turn is over. Next active player.
        let nextP = getNextActivePlayer(newPlayers, state.currentPlayerIndex);
        if (nextP === -1) return endEpoch({ ...s, players: newPlayers, auctionTrack: newAuctionTrack });

        return {
           ...s,
           players: newPlayers,
           auctionTrack: newAuctionTrack,
           currentPlayerIndex: nextP
        };
     }

     case 'ACKNOWLEDGE_AUCTION_RESULT': {
         const newState = { ...state, auctionResult: undefined };
         if (newState.disasterQueue && newState.disasterQueue.length > 0) {
            newState.phase = 'disaster_resolution';
            return newState;
         }
         
         const raCallerIdx = state.raCallerIndex !== undefined ? state.raCallerIndex : state.currentPlayerIndex;
         let nextP = getNextActivePlayer(newState.players, raCallerIdx);
         if (nextP === -1) return endEpoch(newState);
         newState.currentPlayerIndex = nextP;
         newState.phase = 'action_select';
         return newState;
     }

     case 'NEXT_EPOCH':
        return { ...state, phase: 'action_select' };

     default:
        return state;
   }
}

function resolveAuction(state: GameState): GameState {
  if (state.highestBid !== undefined && state.highestBidderIndex !== undefined) {
     const winnerIndex = state.highestBidderIndex;
     const winner = state.players[winnerIndex];
     
     const newTableau = [...winner.tableau, ...state.auctionTrack];
     const wonSun = state.centerSun;
     const spentSun = state.highestBid;
     
     const newActiveSuns = winner.activeSuns.filter(s => s !== spentSun);
     const newInactiveSuns = [...winner.inactiveSuns, wonSun];
     
     const newPlayers = [...state.players];
     newPlayers[winnerIndex] = { ...winner, tableau: newTableau, activeSuns: newActiveSuns, inactiveSuns: newInactiveSuns };
     
     const disastersList: TileType[] = [];
     newTableau.forEach(t => {
       if (['BURIAL', 'DROUGHT', 'UNREST', 'EARTHQUAKE'].includes(t.type)) {
         disastersList.push(t.type as TileType);
       }
     });
     
     const cleanedTableau = newTableau.filter(t => !['BURIAL', 'DROUGHT', 'UNREST', 'EARTHQUAKE'].includes(t.type));
     newPlayers[winnerIndex] = { ...newPlayers[winnerIndex], tableau: cleanedTableau };

     let newState = addLog(state, `${winner.name} gewinnt mit ${spentSun} (erhält ${wonSun}).`);

     newState = {
        ...newState,
        players: newPlayers,
        auctionTrack: [],
        centerSun: spentSun,
        biddingOrder: [],
        highestBid: undefined,
        highestBidderIndex: undefined,
        auctionResult: {
           winnerIndex,
           spentSun,
           wonSun,
           winningTiles: state.auctionTrack,
           allPassed: false,
           tilesCleared: false
        },
        phase: 'auction_result'
     };

     if (disastersList.length > 0) {
        newState.disasterQueue = disastersList.map(d => ({ playerIndex: winnerIndex, disasterType: d, count: 2 }));
     }

     return newState;

  } else {
     let nextTrack = [...state.auctionTrack];
     const tilesCleared = state.biddingReason === 'called_ra_forced' || state.auctionTrack.length >= 8;
     if (tilesCleared) {
        nextTrack = [];
     }
     let s = addLog(state, `Alle passen. Vorgang beendet.`);
     const newState = {
        ...s,
        auctionTrack: nextTrack,
        biddingOrder: [],
        highestBid: undefined,
        highestBidderIndex: undefined,
        auctionResult: {
           winningTiles: state.auctionTrack,
           allPassed: true,
           tilesCleared
        },
        phase: 'auction_result'
     };
     
     return newState;
  }
}
