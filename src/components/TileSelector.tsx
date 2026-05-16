import { useState, useRef } from 'react';
import { Tile, TileType, CivSubtype, MonSubtype } from '../types';
import TileView from './TileView';
import { Camera, RefreshCw } from 'lucide-react';

interface TileSelectorProps {
  onSelect: (tile: Tile) => void;
  onCancel: () => void;
  title?: string;
}

const CATEGORIES: { type: TileType, label: string }[] = [
  { type: 'RA', label: 'Ra' },
  { type: 'GOD', label: 'Gott' },
  { type: 'PHARAOH', label: 'Pharao' },
  { type: 'BURIAL', label: 'Begräbnis' },
  { type: 'NILE', label: 'Nil' },
  { type: 'FLOOD', label: 'Überschwemmung' },
  { type: 'DROUGHT', label: 'Dürre' },
  { type: 'CIVILIZATION', label: 'Zivil.' },
  { type: 'UNREST', label: 'Unruhen' },
  { type: 'GOLD', label: 'Gold' },
  { type: 'MONUMENT', label: 'Monument' },
  { type: 'EARTHQUAKE', label: 'Erdbeben' }
];

const CIV_SUBTYPES: CivSubtype[] = ['Künste', 'Landwirtschaft', 'Religion', 'Astronomie', 'Schrift'];
const MON_SUBTYPES: MonSubtype[] = ['Festung', 'Obelisk', 'Palast', 'Pyramide', 'Sphinx', 'Statuen', 'Stufenpyramide', 'Tempel'];

export default function TileSelector({ onSelect, onCancel, title }: TileSelectorProps) {
  const [selectedType, setSelectedType] = useState<TileType | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setScanning(true);
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', aspectRatio: { ideal: 2.33 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera error', err);
      setErrorMsg('Kamera konnte nicht gestartet werden.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    setLoading(true);
    setErrorMsg('');
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    stopCamera();

    try {
      const resp = await fetch('/api/identify-tile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl })
      });
      if (!resp.ok) {
        throw new Error('Fehler bei der API Anfrage');
      }
      const data = await resp.json();
      
      if (data && data.type) {
         onSelect({
            id: Math.random().toString(36).substring(7),
            type: data.type as TileType,
            subtype: data.subtype as any
         });
      } else {
         throw new Error('Konnte Plättchen nicht erkennen.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ein Fehler ist aufgetreten.');
      setLoading(false);
    }
  };

  const handleSelectType = (type: TileType) => {
    if (type === 'CIVILIZATION' || type === 'MONUMENT') {
      setSelectedType(type);
    } else {
      onSelect({ id: Math.random().toString(36).substring(7), type });
    }
  };

  const handleSelectSubtype = (subtype: string) => {
    onSelect({ 
      id: Math.random().toString(36).substring(7), 
      type: selectedType!, 
      subtype: subtype as any 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#151515] rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-[#D4AF37]/20 text-[#e0e0e0]">
        <div className="bg-[#141414] border-b border-[#D4AF37]/20 p-4 flex justify-between items-center text-[#D4AF37]">
          <h2 className="text-xl font-serif uppercase tracking-widest text-[#D4AF37]">{scanning ? 'Kamera Scan' : (title || 'Plättchen Wählen')}</h2>
          <button onClick={() => { stopCamera(); onCancel(); }} className="text-[#D4AF37]/50 hover:text-[#D4AF37] font-bold text-2xl leading-none transition-colors">&times;</button>
        </div>
        
        <div className="p-6">
          {errorMsg && (
             <div className="mb-4 text-xs text-red-400 bg-red-900/20 p-2 border border-red-500 rounded text-center">
               {errorMsg}
             </div>
          )}

          {scanning ? (
            <div className="flex flex-col items-center gap-4">
               <div className="w-full bg-black aspect-[21/9] sm:max-w-lg rounded overflow-hidden relative">
                 <video 
                   ref={videoRef} 
                   autoPlay 
                   playsInline 
                   className="w-full h-full object-cover" 
                 />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[40%] border-[3px] border-[#D4AF37]/50 rounded-lg pointer-events-none"></div>
               </div>
               <div className="flex gap-4">
                 <button 
                   onClick={stopCamera}
                   className="bg-[#222] border border-[#D4AF37]/30 text-[#e0e0e0] font-bold py-2 px-6 rounded uppercase tracking-widest text-xs"
                 >
                   Abbrechen
                 </button>
                 <button 
                   onClick={capturePhoto}
                   className="bg-[#D4AF37] text-black font-bold py-2 px-8 rounded uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-[#b8962d]"
                 >
                   <Camera size={16} /> Aufnehmen
                 </button>
               </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
               <RefreshCw className="w-10 h-10 text-[#D4AF37] animate-spin" />
               <p className="text-sm font-mono text-[#999] uppercase tracking-widest">Analysiere Plättchen...</p>
            </div>
          ) : !selectedType ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-4 gap-3">
                {CATEGORIES.map(c => {
                   const dummyTile: Tile = { id: 'd', type: c.type };
                   return (
                     <button 
                       key={c.type}
                       onClick={() => handleSelectType(c.type)}
                       className="flex flex-col items-center gap-2 hover:bg-[#222] p-2 border border-transparent hover:border-[#D4AF37]/30 transition-all rounded"
                     >
                       <TileView tile={dummyTile} className="w-12 h-12" />
                       <span className="text-[10px] uppercase tracking-widest text-[#999] text-center leading-tight">{c.label}</span>
                     </button>
                   );
                })}
              </div>
              <div className="border-t border-[#D4AF37]/20 pt-4 flex justify-center">
                 <button 
                   onClick={startCamera}
                   className="w-full max-w-xs bg-[#222] border border-[#D4AF37]/30 text-[#D4AF37] font-bold py-3 px-6 rounded uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#D4AF37] hover:text-black transition-colors"
                 >
                   <Camera size={18} /> Kamera Scan
                 </button>
              </div>
            </div>
          ) : (
            <div>
               <div className="mb-4">
                 <button onClick={() => setSelectedType(null)} className="text-xs text-[#D4AF37] font-mono hover:text-[#b8962d] uppercase tracking-wider transition-colors">
                   &larr; Zurück
                 </button>
               </div>
               <div className="grid grid-cols-4 gap-4">
                 {(selectedType === 'CIVILIZATION' ? CIV_SUBTYPES : MON_SUBTYPES).map(sub => (
                    <button 
                      key={sub}
                      onClick={() => handleSelectSubtype(sub)}
                      className="flex flex-col items-center gap-2 hover:bg-[#222] p-2 border border-transparent hover:border-[#D4AF37]/30 transition-all rounded"
                    >
                      <TileView tile={{ id: 'd', type: selectedType, subtype: sub as any }} className="w-12 h-12" />
                      <span className="text-[10px] uppercase tracking-widest text-[#999] text-center leading-tight">{sub.substring(0,8)}</span>
                    </button>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
