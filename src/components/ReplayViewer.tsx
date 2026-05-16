import React, { useState } from 'react';
import { ReplayStep, Player, GameState } from '../types';
import TileView from './TileView';

interface ReplayViewerProps {
  replay: ReplayStep[];
  onClose: () => void;
  finalPlayers: Player[];
}

export default function ReplayViewer({ replay, onClose, finalPlayers }: ReplayViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (replay.length === 0) {
    return (
       <div className="min-h-screen bg-[#0c0c0c] text-[#e0e0e0] flex items-center justify-center p-8">
          <p>Keine Replay-Daten verfügbar.</p>
          <button onClick={onClose} className="ml-4 bg-[#D4AF37] px-4 py-2 text-black rounded">Schließen</button>
       </div>
    );
  }

  const step = replay[currentIndex];
  // Reconstruct UI mostly similar to GameBoard 
  // However, `step.stateSnapshot` doesn't have the replay array (that's fine).
  const state = step.stateSnapshot as GameState;

  const nextStep = () => setCurrentIndex(c => Math.min(c + 1, replay.length - 1));
  const prevStep = () => setCurrentIndex(c => Math.max(c - 1, 0));

  return (
    <div className="fixed inset-0 bg-[#080808] z-50 flex flex-col font-sans text-[#e0e0e0] overflow-y-auto">
       <header className="flex-shrink-0 border-b border-[#D4AF37]/20 p-4 bg-[#111] flex justify-between items-center sticky top-0 z-20 shadow-xl">
         <div className="flex gap-4 items-center">
            <h2 className="text-xl font-serif uppercase tracking-widest text-[#D4AF37]">Wiedergabe-Modus</h2>
            <div className="text-xs text-[#999]">
               Schritt {currentIndex + 1} / {replay.length}
            </div>
         </div>
         <div className="flex gap-2">
           <button disabled={currentIndex === 0} onClick={prevStep} className="bg-[#222] text-[#e0e0e0] hover:bg-[#333] disabled:opacity-30 border border-[#D4AF37]/30 px-4 py-2 text-sm uppercase tracking-wider rounded">Zurück</button>
           <button disabled={currentIndex === replay.length - 1} onClick={nextStep} className="bg-[#222] text-[#e0e0e0] hover:bg-[#333] disabled:opacity-30 border border-[#D4AF37]/30 px-4 py-2 text-sm uppercase tracking-wider rounded">Weiter</button>
           <button onClick={onClose} className="ml-6 bg-[#D4AF37] text-black hover:bg-[#b8962d] font-bold px-6 py-2 text-sm uppercase tracking-wider rounded">Wiedergabe Beenden</button>
         </div>
       </header>

       <div className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col gap-6 md:flex-row mt-4">
         <div className="flex-1 flex flex-col gap-6">
            {/* Explanation Panel */}
            <div className="bg-[#1a1a1a] border-l-4 border-l-[#D4AF37] p-6 rounded shadow-lg">
               <h3 className="text-[#D4AF37]/60 text-[10px] uppercase tracking-widest mb-2">Aktion</h3>
               <p className="text-lg font-bold mb-2">{step.message}</p>
               {step.explanation && (
                 <div className="bg-[#111] p-4 text-sm mt-3 border border-[#D4AF37]/10 rounded shadow-inner text-[#b3b3b3]">
                   <p className="text-[#D4AF37]/80 text-[10px] font-bold tracking-widest uppercase mb-1">KI Begründung</p>
                   {step.explanation}
                 </div>
               )}
            </div>

            {/* Auction Track */}
            <div className="bg-[#151515] p-6 border border-[#D4AF37]/10 rounded flex flex-col items-center">
                <h3 className="text-center font-serif text-lg text-[#D4AF37] mb-6">Auktionsleiste (Start der Aktion)</h3>
                <div className="flex gap-4">
                 <div className="w-16 h-16 bg-[#222] border-2 border-[#D4AF37] flex items-center justify-center text-3xl font-serif text-[#D4AF37] shadow-xl">
                   {state.centerSun}
                 </div>
                 <div className="flex flex-wrap gap-2 justify-center">
                    {Array.from({length: 8}).map((_, i) => {
                       const t = state.auctionTrack[i];
                       return (
                          <div key={i} className="w-16 h-16 bg-[#222] border border-dashed border-[#D4AF37]/20 flex items-center justify-center relative rounded overflow-hidden">
                             {t ? <TileView tile={t} className="w-full h-full border-none shadow-none text-xs absolute inset-0" /> : <span className="text-[10px] text-[#444] uppercase tracking-widest absolute">Leer</span>}
                          </div>
                       )
                    })}
                 </div>
                </div>
            </div>
         </div>

         {/* Players */}
         <div className="w-full md:w-96 flex flex-col gap-4">
            <h3 className="text-[#D4AF37] font-serif uppercase tracking-widest text-center">Spielertableaus</h3>
            {state.players.map(p => {
               // Find final score of this player to display
               const finalP = finalPlayers.find(f => f.id === p.id);
               return (
               <div key={p.id} className="p-4 bg-[#1a1a1a] shadow-lg border-l-[3px] border-[#6d6d6d] rounded space-y-2">
                  <div className="flex justify-between items-start">
                     <div>
                       <p className="text-lg font-serif text-[#e0e0e0] leading-none mb-1">{p.name}</p>
                       <p className="text-[9px] uppercase text-[#666]">{p.isAI ? `KI (${p.difficulty})` : 'Mensch'}</p>
                     </div>
                     <div className="text-right flex flex-col items-end">
                       <span className="text-xs font-mono text-[#999] border border-[#333] px-2 rounded mb-1">{p.score} Pkt.</span>
                       {finalP && <span className="text-[9px] text-[#D4AF37]">Endstand: {finalP.score}</span>}
                     </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                     {p.activeSuns.map(s => (
                       <div key={'a'+s} className="w-6 h-6 rounded border border-[#D4AF37] bg-[#D4AF37]/10 flex items-center justify-center font-bold text-[#D4AF37] text-xs">
                         {s}
                       </div>
                     ))}
                     {p.inactiveSuns.map(s => (
                       <div key={'i'+s} className="w-6 h-6 rounded border border-[#D4AF37]/30 flex items-center justify-center font-normal text-[#666] text-xs opacity-60">
                         {s}
                       </div>
                     ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                     {p.tableau.map(t => <TileView key={t.id} tile={t} className="w-8 h-8" />)}
                  </div>
               </div>
            )})}
         </div>

       </div>
    </div>
  );
}
