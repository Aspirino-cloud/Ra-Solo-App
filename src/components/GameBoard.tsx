import React, { useEffect, useState, useRef } from 'react';
import { Music, X } from 'lucide-react';
import { GameState, Tile, Sun } from '../types';
import { GameAction } from '../lib/gameReducer';
import { computeAIAction, computeAIBid, computeAIDisasterDiscards } from '../lib/aiLogic';
import { getMaxRa } from '../lib/gameLogic';
import { updateAIWeights } from '../lib/learningAI';
import TileView from './TileView';
import TileSelector from './TileSelector';
import ReplayViewer from './ReplayViewer';
import { MusicPlayer } from './MusicPlayer';
import { RulesViewer } from './RulesViewer';

interface GameBoardProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  onRestart?: () => void;
}

export default function GameBoard({ gameState, dispatch, onRestart }: GameBoardProps) {
  const [showTileSelector, setShowTileSelector] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const hasLearnedRef = useRef(false);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // AI Hooks
  useEffect(() => {
    if (gameState.phase === 'action_select' && currentPlayer.isAI) {
      const timer = setTimeout(() => {
         const { action, explanation } = computeAIAction(gameState, gameState.currentPlayerIndex);
         dispatch({ ...action, explanation });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.currentPlayerIndex, currentPlayer.isAI]);

  useEffect(() => {
    if (gameState.phase === 'bidding') {
       const cbIdx = gameState.biddingOrder[gameState.currentBidderPos];
       if (cbIdx !== undefined) {
         const cbP = gameState.players[cbIdx];
         if (cbP.isAI) {
           const timer = setTimeout(() => {
              const { sun, explanation } = computeAIBid(gameState, cbIdx);
              dispatch({ type: 'PLACE_BID', payload: { sun }, explanation });
           }, 1500);
           return () => clearTimeout(timer);
         }
       }
    }
  }, [gameState.phase, gameState.currentBidderPos, gameState.biddingOrder]);

  useEffect(() => {
    if (gameState.phase === 'disaster_resolution' && gameState.disasterQueue.length > 0) {
      const dq = gameState.disasterQueue[0];
      const p = gameState.players[dq.playerIndex];
      if (p.isAI) {
         const timer = setTimeout(() => {
            const discards = computeAIDisasterDiscards(p, dq);
            dispatch({ type: 'DISASTER_RESOLVED', payload: { discardedTileIds: discards }, explanation: `KI wirft Plättchen ab wegen ${dq.disasterType}.` });
         }, 1000);
         return () => clearTimeout(timer);
      }
    }
  }, [gameState.phase, gameState.disasterQueue]);

  // AI drawn tile requested => human must enter it
  useEffect(() => {
    if (gameState.phase === 'waiting_for_drawn_tile' && currentPlayer.isAI) {
      setShowTileSelector(true);
    }
  }, [gameState.phase, currentPlayer.isAI]);

  // Learning trigger
  useEffect(() => {
    if (gameState.phase === 'game_over' && !hasLearnedRef.current) {
       updateAIWeights(gameState.players);
       hasLearnedRef.current = true;
    }
  }, [gameState.phase, gameState.players]);

  // Handlers for Human
  const handleHumanDraw = () => {
    dispatch({ type: 'CHOOSE_DRAW', explanation: 'Spieler entscheidet sich, ein Plättchen zu ziehen.' });
    setShowTileSelector(true);
  };

  const handleTileDrawn = (tile: Tile) => {
    setShowTileSelector(false);
    dispatch({ type: 'TILE_DRAWN', payload: tile });
  };

  const handleHumanCallRa = () => {
    dispatch({ type: 'CALL_RA', payload: { forced: false }, explanation: 'Spieler ruft absichtlich RA.' });
  };

  const maxRa = getMaxRa(gameState.players.length);

  if (showReplay) {
     return <ReplayViewer replay={gameState.replay} finalPlayers={gameState.players} onClose={() => setShowReplay(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] pb-24 font-sans text-[#e0e0e0] flex flex-col underline-offset-4">
      {/* Header / Ra Track */}
      <header className="h-20 border-b border-[#D4AF37]/20 bg-[#141414] px-4 md:px-10 flex items-center justify-between sticky top-0 z-10 w-full">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#D4AF37] rotate-45 hidden md:flex items-center justify-center">
            <span className="-rotate-45 font-serif text-[#D4AF37] font-bold text-xl leading-none">RA</span>
          </div>
          <h1 className="text-2xl font-serif tracking-widest text-[#D4AF37] uppercase">Companion App</h1>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-tighter text-[#D4AF37]/60">Aktuelle Epoche</span>
            <span className="text-lg font-serif">{gameState.epoch}/3</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-tighter text-[#D4AF37]/60">Ra Zähler</span>
            <div className="flex gap-1 mt-1">
              {Array.from({length: maxRa}).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < gameState.raTrack ? 'bg-[#D4AF37]' : 'bg-[#333]'}`}></div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRules(true)}
                className="hidden sm:block ml-4 text-[10px] uppercase tracking-widest font-bold text-[#D4AF37]/60 hover:text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 px-3 py-1.5 rounded transition-all"
              >
                Spielregeln
              </button>
              <button
                onClick={() => setShowRestartConfirm(true)}
                className="hidden sm:block text-[10px] uppercase tracking-widest font-bold text-[#D4AF37]/60 hover:text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 px-3 py-1.5 rounded transition-all"
              >
                Neustart
              </button>
            </div>
            {showRestartConfirm && (
               <div className="absolute top-10 right-0 bg-[#1a1a1a] border border-red-500/50 p-4 rounded shadow-2xl z-50 w-64">
                 <p className="text-sm text-red-400 mb-4 font-bold text-center">Spiel wirklich abbrechen und neu starten?</p>
                 <div className="flex gap-2 justify-center">
                   <button 
                     onClick={() => setShowRestartConfirm(false)}
                     className="px-3 py-2 text-xs border border-[#333] hover:bg-[#333] rounded"
                   >
                     Abbrechen
                   </button>
                   <button 
                     onClick={() => {
                        setShowRestartConfirm(false);
                        if (onRestart) onRestart();
                        else window.location.reload();
                     }}
                     className="px-3 py-2 text-xs bg-red-900 border border-red-500 rounded text-red-100 hover:bg-red-800"
                   >
                     Neustart bestätigen
                   </button>
                 </div>
               </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-8 mt-4">
        
        {/* Game Center */}
        <section className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-[#151515] rounded-lg border border-[#D4AF37]/10 p-6 relative flex flex-col">
             <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
               <span className="text-[150px] font-serif uppercase tracking-tighter">RA</span>
             </div>
             <h3 className="text-center font-serif text-xl text-[#D4AF37] mb-8 relative z-10">Auktionsleiste</h3>
             
             <div className="flex flex-wrap gap-4 items-center justify-center relative z-10">
               {/* Center Sun & Bidding area */}
               <div className="flex flex-col items-center justify-center p-4 min-w-[100px]">
                 <div className="w-16 h-16 bg-[#222] border-2 border-[#D4AF37] flex items-center justify-center text-3xl font-serif text-[#D4AF37] shadow-xl">
                   {gameState.centerSun}
                 </div>
                 {gameState.phase === 'bidding' && (
                    <div className="mt-4 text-center">
                      <span className="text-[10px] font-bold text-red-500 animate-pulse uppercase tracking-widest">Bietrunde</span>
                      <div className="text-xs text-[#999] mt-1">Gebot: <strong className="text-lg text-[#e0e0e0] font-serif">{gameState.highestBid || '-'}</strong></div>
                    </div>
                 )}
               </div>

               {/* Auction Track */}
               <div className="flex flex-wrap gap-2 justify-center">
                  {Array.from({length: 8}).map((_, i) => {
                     const t = gameState.auctionTrack[i];
                     return (
                        <div key={i} className="w-16 h-16 bg-[#222] border-2 border-dashed border-[#D4AF37]/20 flex items-center justify-center relative rounded overflow-hidden">
                           {t ? <TileView tile={t} className="w-full h-full border-none shadow-none text-xs absolute inset-0" /> : <span className="text-[10px] text-[#444] uppercase tracking-widest absolute">Leer</span>}
                        </div>
                     )
                  })}
               </div>
             </div>
          </div>

          {/* Action / Message Panel */}
          <div className="w-full md:w-80 flex flex-col gap-4">
             <div className="bg-[#1a1a1a] border border-[#D4AF37]/20 p-6 flex flex-col gap-4 flex-1 rounded text-center md:text-left">
               <div>
                 <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/50 mb-2">Spielstatus</h2>
                 <h3 className="text-sm font-serif text-[#D4AF37] mb-1 leading-snug">
                    {gameState.phase === 'action_select' && `${currentPlayer.name} entscheidet...`}
                    {gameState.phase === 'bidding' && `Bietrunde: ${gameState.players[gameState.biddingOrder[gameState.currentBidderPos]]?.name} ist am Zug`}
                    {gameState.phase === 'auction_result' && `Auktionsergebnis`}
                    {gameState.phase === 'waiting_for_drawn_tile' && `Warte auf gezogenes Plättchen...`}
                    {gameState.phase === 'disaster_resolution' && `Katastrophe wird abgehandelt`}
                    {gameState.phase === 'epoch_end' && `Ende der Epoche`}
                    {gameState.phase === 'game_over' && `Spielende`}
                 </h3>
               </div>
               
               {/* Controls for current Human player or AI requiring manual tile draw */}
               {((!currentPlayer.isAI && gameState.phase === 'action_select') || gameState.phase === 'waiting_for_drawn_tile') && (
                 <div className="flex flex-col gap-3 mt-4">
                   {gameState.phase === 'waiting_for_drawn_tile' ? (
                      <button 
                         onClick={() => setShowTileSelector(true)}
                         className="w-full bg-[#D4AF37] text-black font-bold py-3 px-4 uppercase tracking-widest text-xs hover:bg-[#b8962d] transition-colors text-center rounded border border-[#D4AF37]"
                       >
                         Plättchen für {currentPlayer.name} Scannen/Wählen
                       </button>
                   ) : (
                     <button 
                       disabled={gameState.auctionTrack.length >= 8}
                       onClick={handleHumanDraw}
                       className="w-full bg-[#D4AF37] text-black font-bold py-3 px-4 uppercase tracking-widest text-xs hover:bg-[#b8962d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-center rounded border border-[#D4AF37]"
                     >
                       Plättchen Ziehen
                     </button>
                   )}
                   {gameState.phase === 'action_select' && (
                     <button 
                       onClick={handleHumanCallRa}
                       className="w-full bg-red-900 border border-red-500 text-red-200 font-bold py-3 px-4 uppercase tracking-widest text-xs hover:bg-red-800 transition-colors text-center rounded"
                     >
                       Ra Anrufen
                     </button>
                   )}
                 </div>
               )}

               {gameState.phase === 'epoch_end' && (
                 <button 
                     onClick={() => dispatch({type: 'NEXT_EPOCH'})}
                     className="mt-4 w-full bg-[#D4AF37] text-black font-bold py-3 px-4 uppercase tracking-widest text-xs hover:bg-[#b8962d] transition-colors text-center rounded"
                   >
                     Start Next Era
                 </button>
               )}

               {gameState.phase === 'bidding' && !gameState.players[gameState.biddingOrder[gameState.currentBidderPos]]?.isAI && (
                  <div className="flex gap-2 flex-wrap mt-4 justify-center">
                     <button 
                       onClick={() => dispatch({type: 'PLACE_BID', payload: { sun: undefined }})}
                       className="bg-[#222] border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 text-[#999] hover:text-[#e0e0e0] font-bold py-2 px-4 uppercase tracking-widest text-xs transition-colors flex-1 min-w-[30%] text-center rounded"
                     >
                       Pass
                     </button>
                     {gameState.players[gameState.biddingOrder[gameState.currentBidderPos]].activeSuns
                       .filter(s => s > (gameState.highestBid || 0))
                       .map(s => (
                         <button 
                           key={s}
                           onClick={() => dispatch({type: 'PLACE_BID', payload: { sun: s }})}
                           className="bg-[#D4AF37] hover:bg-[#b8962d] text-black font-black text-lg py-1 px-4 border border-[#e0e0e0] shadow-xl flex-1 min-w-[30%] text-center rounded"
                         >
                           {s}
                         </button>
                     ))}
                  </div>
               )}
             </div>

             <div className="h-32 bg-[#0c0c0c] border border-[#D4AF37]/10 p-4 font-mono text-[10px] overflow-y-auto flex flex-col gap-1 rounded">
                {gameState.logs.slice(-6).map((log, i) => (
                   <p key={i} className={i === gameState.logs.length - 1 ? 'text-[#D4AF37]' : 'text-[#666]'}>
                     {`[Log] ${log}`}
                   </p>
                ))}
             </div>
          </div>
        </section>

        {/* Players Tableaus */}
        <div className="mt-4">
           <h2 className="text-sm font-serif text-[#D4AF37] uppercase tracking-widest mb-4">Spieler</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gameState.players.map(p => (
                 <div key={p.id} className={`p-5 bg-[#1a1a1a] shadow-xl border-l-[3px] rounded-r-lg ${p.id === currentPlayer.id && gameState.phase === 'action_select' ? 'border-[#D4AF37] transform scale-[1.01] transition-transform' : 'border-[#6d6d6d] opacity-85'}`}>
                    <div className="flex justify-between items-start mb-4">
                       <div>
                         <p className="text-xl font-serif text-[#e0e0e0] leading-none mb-1">{p.name}</p>
                         <p className={`text-[9px] uppercase font-bold tracking-wider ${p.isAI ? 'text-blue-400' : 'text-green-500'}`}>{p.isAI ? 'Simulierter Gegner' : 'Menschlicher Spieler'}</p>
                       </div>
                       <div className="bg-[#252525] px-2 py-1 text-xs font-mono border border-[#333] text-[#D4AF37] rounded">{p.score} Pkt.</div>
                    </div>
                    
                    <div className="mb-4 flex flex-wrap gap-2">
                       {p.activeSuns.map(s => (
                         <div key={s} className="w-8 h-8 rounded border border-[#D4AF37] bg-[#D4AF37]/10 flex items-center justify-center font-bold text-[#D4AF37] text-sm shadow">
                           {s}
                         </div>
                       ))}
                       {p.inactiveSuns.map(s => (
                         <div key={s} className="w-8 h-8 rounded border border-[#D4AF37]/30 flex items-center justify-center font-normal text-[#666] text-sm opacity-60">
                           {s}
                         </div>
                       ))}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-[#D4AF37]/10 min-h-[60px]">
                       {p.tableau.map(t => <TileView key={t.id} tile={t} className="w-10 h-10 border border-[#D4AF37]/20" />)}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </main>

      {showTileSelector && <TileSelector title={gameState.phase === 'waiting_for_drawn_tile' ? `Für ${currentPlayer.name} Ziehen` : undefined} onSelect={handleTileDrawn} onCancel={() => setShowTileSelector(false)} />}
      
      {/* Rules Modal */}
      {showRules && <RulesViewer onClose={() => setShowRules(false)} />}
      
      {/* Auction Result Modal */}
      {gameState.phase === 'auction_result' && gameState.auctionResult && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#151515] rounded-xl shadow-2xl max-w-lg w-full p-6 text-center border border-[#D4AF37]/50 text-[#e0e0e0]">
               <h2 className="text-2xl font-serif text-[#D4AF37] mb-4 uppercase tracking-widest">
                  {gameState.auctionResult.allPassed ? 'Auktion Beendet (Alle passen)' : 'Auktion Beendet'}
               </h2>
               
               {!gameState.auctionResult.allPassed && gameState.auctionResult.winnerIndex !== undefined && (
                 <>
                   <p className="mb-4 font-sans text-[#999] text-base">
                     <strong className="text-white text-lg">{gameState.players[gameState.auctionResult.winnerIndex].name}</strong> hat die Auktion mit <strong className="text-[#D4AF37]">{gameState.auctionResult.spentSun} Sonnen</strong> gewonnen. 
                     {gameState.auctionResult.wonSun !== undefined && ` Erhält dafür die ${gameState.auctionResult.wonSun} in die inaktiven Sonnen.`}
                   </p>
                   {gameState.auctionResult.winningTiles.length > 0 && (
                     <div className="mb-6">
                       <p className="text-xs uppercase tracking-widest text-[#D4AF37]/70 mb-2">Erworbene Plättchen</p>
                       <div className="flex flex-wrap justify-center gap-2 max-h-48 overflow-y-auto">
                         {gameState.auctionResult.winningTiles.map(t => (
                           <div key={t.id} className="scale-75 origin-top">
                             <TileView tile={t} />
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </>
               )}
               
               {gameState.auctionResult.allPassed && (
                 <p className="mb-6 font-sans text-[#999] text-sm">
                   Niemand hat geboten.
                   {gameState.auctionResult.tilesCleared ? ' Die Plättchen auf dem Auktionspfad wurden abgeräumt.' : ''}
                 </p>
               )}
               
               <button 
                  onClick={() => dispatch({ type: 'ACKNOWLEDGE_AUCTION_RESULT' })}
                  className="bg-[#D4AF37] hover:bg-[#b8962d] text-black font-bold py-3 px-6 rounded shadow w-full transition-colors uppercase tracking-widest text-sm"
               >
                  Weiter
               </button>
            </div>
         </div>
      )}

      {/* Human Disaster Modal */}
      {gameState.phase === 'disaster_resolution' && !gameState.players[gameState.disasterQueue[0].playerIndex].isAI && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#151515] rounded-lg shadow-2xl max-w-md w-full p-6 text-center border border-red-900 border-t-4 text-[#e0e0e0]">
               <h2 className="text-2xl font-serif text-red-500 mb-2 uppercase tracking-widest">Katastrophe!</h2>
               <p className="mb-6 font-sans text-[#999] text-sm">Du hast ein <strong className="uppercase text-[#D4AF37]">{gameState.disasterQueue[0].disasterType}</strong> gezogen. Um dies in der App zu verbuchen, werden automatisch Plättchen abgeworfen (zufällig in der MVP-Version).</p>
               <button 
                  onClick={() => {
                     // Since MVP, we just compute random discard
                     const pIdx = gameState.disasterQueue[0].playerIndex;
                     const discards = computeAIDisasterDiscards(gameState.players[pIdx], gameState.disasterQueue[0]);
                     dispatch({ type: 'DISASTER_RESOLVED', payload: { discardedTileIds: discards } });
                  }}
                  className="bg-red-900 border border-red-500 hover:bg-red-800 text-red-100 font-bold py-3 px-6 rounded shadow w-full transition-colors uppercase tracking-widest text-xs"
               >
                  Verstanden
               </button>
            </div>
         </div>
      )}

      {/* Game Over Modal */}
      {gameState.phase === 'game_over' && (
         <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] rounded-lg shadow-2xl max-w-lg w-full p-8 border border-[#D4AF37]/30 text-center flex flex-col">
               <h2 className="text-4xl font-serif text-[#D4AF37] mb-8 uppercase tracking-[0.3em]">Spielende</h2>
               <div className="space-y-3 mb-10 w-full">
                 {[...gameState.players].sort((a,b)=>b.score - a.score).map((p, i) => (
                   <div key={p.id} className="flex justify-between items-center text-lg p-3 bg-[#1a1a1a] border border-[#D4AF37]/10 rounded">
                      <span className="font-serif text-[#e0e0e0]">{i+1}. {p.name} {p.isAI && <span className="text-xs text-[#666] font-sans ml-2">(KI)</span>}</span>
                      <span className="font-mono text-[#D4AF37] font-bold">{p.score} <span className="text-[10px] font-sans text-[#666] uppercase tracking-widest mr-1">Pkt.</span></span>
                   </div>
                 ))}
               </div>
               <div className="flex flex-col gap-3 mt-4 w-full">
                 <button 
                   onClick={() => setShowReplay(true)}
                   className="bg-[#222] border border-[#D4AF37]/50 hover:bg-[#333] text-[#e0e0e0] font-bold py-3 px-6 rounded uppercase tracking-widest text-sm transition-colors"
                 >
                   Spielanalyse Ansehen (Replay)
                 </button>
                 <button 
                   onClick={() => { if (onRestart) onRestart(); else window.location.reload(); }}
                   className="bg-[#D4AF37] hover:bg-[#b8962d] text-black font-bold py-4 px-6 rounded uppercase tracking-widest text-sm transition-colors"
                 >
                   Neues Spiel
                 </button>
               </div>
            </div>
         </div>
      )}

      {/* Music Player Floating Panel */}
      <div className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${showMusicPlayer ? 'w-[340px] h-[480px] shadow-2xl' : 'w-12 h-12 shadow-none'}`}>
        {!showMusicPlayer ? (
          <button
            onClick={() => setShowMusicPlayer(true)}
            className="w-12 h-12 bg-[#1a1a1a] shadow-lg border border-[#D4AF37]/50 rounded-full flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors"
            title="Musik Player öffnen"
          >
            <Music size={20} />
          </button>
        ) : (
          <MusicPlayer onClose={() => setShowMusicPlayer(false)} />
        )}
      </div>
    </div>
  );
}
