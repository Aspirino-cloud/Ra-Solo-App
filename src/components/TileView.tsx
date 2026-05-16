import React from 'react';
import { Tile } from '../types';
import { 
  Sun, Shield, User, Skull, Waves, Droplet, Droplets, 
  Book, Ban, Coins, Castle, Mountain
} from 'lucide-react';

const TileView: React.FC<{ tile: Tile, className?: string }> = ({ tile, className = '' }) => {
  const getStyle = (t: Tile) => {
    switch(t.type) {
      case 'RA': return { bg: 'bg-[#1a0000] border-[#ff4444]', icon: <Sun className="w-5 h-5 text-[#ff4444]" /> };
      case 'GOD': return { bg: 'bg-[#1a0f2e] border-[#9966ff]', icon: <Shield className="w-5 h-5 text-[#9966ff]" /> };
      case 'PHARAOH': return { bg: 'bg-[#2a1a08] border-[#D4AF37]', icon: <User className="w-5 h-5 text-[#D4AF37]" /> };
      case 'BURIAL': return { bg: 'bg-[#2a1a08] border-red-500', icon: <Skull className="w-5 h-5 text-red-500" /> };
      case 'NILE': return { bg: 'bg-[#001a33] border-[#3399ff]', icon: <Waves className="w-5 h-5 text-[#3399ff]" /> };
      case 'FLOOD': return { bg: 'bg-[#002b4d] border-[#66b3ff]', icon: <Droplets className="w-5 h-5 text-[#66b3ff]" /> };
      case 'DROUGHT': return { bg: 'bg-[#2a1a08] border-orange-600', icon: <Droplet className="w-5 h-5 text-orange-600" /> };
      case 'CIVILIZATION': return { bg: 'bg-[#002614] border-[#33cc80]', icon: <Book className="w-5 h-5 text-[#33cc80]" />, sub: t.subtype };
      case 'UNREST': return { bg: 'bg-[#002614] border-red-600', icon: <Ban className="w-5 h-5 text-red-600" /> };
      case 'GOLD': return { bg: 'bg-[#2a2200] border-[#ffcc00]', icon: <Coins className="w-5 h-5 text-[#ffcc00]" /> };
      case 'MONUMENT': return { bg: 'bg-[#1a1a1a] border-[#a6a6a6]', icon: <Castle className="w-5 h-5 text-[#a6a6a6]" />, sub: t.subtype };
      case 'EARTHQUAKE': return { bg: 'bg-[#1a1a1a] border-red-700', icon: <Mountain className="w-5 h-5 text-red-700" /> };
      default: return { bg: 'bg-[#222] border-[#D4AF37]/30', icon: null };
    }
  }

  const style = getStyle(tile);

  return (
    <div className={`relative flex flex-col items-center justify-center border rounded ${style.bg} ${className}`}>
      {style.icon}
      {style.sub && (
        <span className="absolute bottom-0 text-[7px] font-bold text-[#e0e0e0] uppercase tracking-tighter truncate w-full text-center bg-black/60 pb-0.5 pt-0.5 rounded-b">
          {style.sub.substring(0, 4)}
        </span>
      )}
    </div>
  );
}

export default TileView;
