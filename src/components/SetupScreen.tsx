import { useState } from 'react';
import { GameState, Player, Sun, Difficulty } from '../types';

interface SetupScreenProps {
  onStart: (gameState: GameState) => void;
}

const INITIAL_SUNS: Record<number, Sun[][]> = {
  2: [[9, 6, 5, 2], [8, 7, 4, 3]],
  3: [[13, 8, 5, 2], [12, 9, 6, 3], [11, 10, 7, 4]],
  4: [[13, 6, 2], [12, 7, 3], [11, 8, 4], [10, 9, 5]],
  5: [[16, 7, 2], [15, 8, 3], [14, 9, 4], [13, 10, 5], [12, 11, 6]]
};

const EGYPTIAN_GODS = ['Osiris', 'Isis', 'Anubis', 'Horus', 'Bastet', 'Seth', 'Thoth', 'Hathor', 'Ptah', 'Sobek'];

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState<number>(3);
  const [playersSetup, setPlayersSetup] = useState<{name: string, isAI: boolean, difficulty: Difficulty}>([
    { name: 'Mensch', isAI: false, difficulty: 'medium' },
    { name: 'Osiris', isAI: true, difficulty: 'medium' },
    { name: 'Isis', isAI: true, difficulty: 'medium' }
  ]);

  const handleCountChange = (count: number) => {
    setPlayerCount(count);
    const newSetup = [...playersSetup];
    while (newSetup.length < count) {
      newSetup.push({ name: EGYPTIAN_GODS[newSetup.length % EGYPTIAN_GODS.length], isAI: true, difficulty: 'medium' });
    }
    setPlayersSetup(newSetup.slice(0, count));
  };

  const handleStart = () => {
    const sunsConfig = INITIAL_SUNS[playerCount];
    
    // Sort logic to determine first player
    // First player is one with highest sun. Our default assignment:
    // AI 1 gets first stapel, etc. but actually we can shuffle assigning.
    // For simplicity, assign directly.
    const players: Player[] = playersSetup.map((p, i) => ({
      id: Math.random().toString(36).substring(7),
      name: p.name,
      isAI: p.isAI,
      difficulty: p.isAI ? p.difficulty : undefined,
      activeSuns: [...sunsConfig[i]].sort((a,b)=>a-b),
      inactiveSuns: [],
      score: 10, 
      tableau: []
    }));
    
    let highestSun = 0;
    let startingIndex = 0;
    players.forEach((p, i) => {
       const pMax = Math.max(...p.activeSuns);
       if (pMax > highestSun) {
         highestSun = pMax;
         startingIndex = i;
       }
    });

    const initialState: GameState = {
      epoch: 1,
      players,
      auctionTrack: [],
      raTrack: 0,
      centerSun: 1,
      currentPlayerIndex: startingIndex,
      phase: 'action_select',
      biddingOrder: [],
      currentBidderPos: 0,
      disasterQueue: [],
      logs: ['Spiel gestartet!'],
      replay: []
    };

    onStart(initialState);
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex flex-col items-center justify-center p-4 font-sans text-[#e0e0e0]">
      <div className="bg-[#141414] p-8 rounded-lg shadow-xl max-w-lg w-full border border-[#D4AF37]/20">
        <h1 className="text-4xl font-serif mb-6 text-center text-[#D4AF37] tracking-widest uppercase">RA Companion</h1>
        
        <div className="mb-6">
          <label className="block text-[10px] uppercase font-semibold mb-2 text-[#D4AF37]/60 tracking-wider">Anzahl der Spieler</label>
          <div className="flex gap-2">
            {[2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => handleCountChange(n)}
                className={`flex-1 py-2 rounded border font-bold transition-colors ${playerCount === n ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#1a1a1a] text-[#666] border-[#D4AF37]/20 hover:text-white'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {playersSetup.map((p, i) => (
            <div key={i} className="flex flex-col gap-2 bg-[#1a1a1a] p-3 rounded-lg border border-[#D4AF37]/10">
              <div className="flex gap-4 items-center">
                <input 
                  type="text" 
                  value={p.name}
                  onChange={(e) => {
                    const newSetup = [...playersSetup];
                    newSetup[i].name = e.target.value;
                    setPlayersSetup(newSetup);
                  }}
                  className="flex-1 bg-[#111] border border-[#D4AF37]/20 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:border-[#D4AF37] focus:ring-[#D4AF37] text-[#e0e0e0]"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={p.isAI}
                    onChange={(e) => {
                      const newSetup = [...playersSetup];
                      newSetup[i].isAI = e.target.checked;
                      setPlayersSetup(newSetup);
                    }}
                    className="w-4 h-4 text-[#D4AF37] bg-[#111] border-[#D4AF37]/30 rounded focus:ring-[#D4AF37]"
                  />
                  <span className="text-xs uppercase tracking-widest text-[#999] font-medium">KI</span>
                </label>
              </div>
              {p.isAI && (
                <div className="mt-2 flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-wider text-[#999] mr-2">Schwierigkeit:</label>
                  <select 
                    value={p.difficulty}
                    onChange={(e) => {
                      const newSetup = [...playersSetup];
                      newSetup[i].difficulty = e.target.value as Difficulty;
                      setPlayersSetup(newSetup);
                    }}
                    className="bg-[#111] border border-[#D4AF37]/20 text-xs rounded px-2 py-1 text-[#e0e0e0] focus:ring-1 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                  >
                    <option value="very_easy">Sehr Einfach</option>
                    <option value="easy">Einfach</option>
                    <option value="medium">Mittel</option>
                    <option value="hard">Schwer</option>
                    <option value="expert">Experte</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>

        <button 
          onClick={handleStart}
          className="w-full bg-[#D4AF37] hover:bg-[#b8962d] text-black font-bold uppercase tracking-widest py-4 px-4 rounded shadow-md transition-colors text-sm"
        >
          Spiel starten
        </button>
      </div>
    </div>
  );
}
