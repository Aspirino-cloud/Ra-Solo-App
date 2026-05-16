import React, { useState } from 'react';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { Music, X, ExternalLink, SkipForward } from 'lucide-react';

const VIDEO_IDS = [
  "I4ZHi9gWET0","5rLrYRzNMnI","jwukt2z0SVM","H5kUTMYRzb0","RkDty5pWxvs","bapa7B2sbio","wMAIp99pbEc","LXowu08m2I8","0AYY5IbIYnM","vGaRZbaosOs","WIkNjxmrIR0","TkbGH-vwcLE","emeB83Q6P1I","KC6EfLdAIVA","EiCKdAN-BEA","3jwOatVBHKE","jxREMTG3dGw","z7tTGGXCudU","Pdi1DSqBZ6Q","N-II7YYFdqs","VFzF3GYx3oo","ZFrWbi0FLTQ","BtMiRuez82Q","U_DVRH7ViRI","mBGPpnkGCpo","1hMPTrMhDuY","24FYrfFYqe4","t41Vgrobbe8","wGKnarWhqus","yJrh-inMHTo","91DZlcsdd4U","vslsS-Uu5x4","39HTrgJXDxc","PLH07SoseXU","8bgNIrlQCRg","sGzVzlDryFE","3xnEd2golwY","pZYlGjCfRZ8","1w0i2Bcy7NA","PFVFoGTXRxE","uGUbtJkgRY8","N_y8ITF2EpY","hsEf0kEUVV0","LQRRaCpICFE","IsqQjib84_Q","pQLAoJGfeIk","VrmxJhm4v7Q","N79xihwHaXs","cE1JSf0Pv2U","iOWuVwMiYqI"
];

export function MusicPlayer({ onClose }: { onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerTitle, setPlayerTitle] = useState("Youtube Player: Bitte Play drücken...");

  const handleReady = (event: YouTubeEvent) => {
    setPlayerTitle(""); // Let youtube player UI show it
    // Wait for a short time to allow autoplay if browser allows
  };

  const handleError = (event: YouTubeEvent) => {
    console.error("YouTube Error", event.data);
    // 2: invalid parameter, 5: html5 error, 100: not found or private, 101/150: playback not allowed in embedded players
    // skip to next track
    nextTrack();
  };

  const nextTrack = () => {
    setCurrentIndex((prev) => (prev + 1) % VIDEO_IDS.length);
  };

  const handleStateChange = (event: YouTubeEvent) => {
    if (event.data === 0) {
      nextTrack();
      setPlayerTitle("Lade nächsten Track...");
    } 
  };

  return (
    <div className="w-full h-full bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-xl overflow-hidden flex flex-col shadow-xl">
      <div className="bg-[#2a2a2a] p-3 flex justify-between items-center border-b border-[#D4AF37]/20">
        <div className="flex items-center gap-2 text-[#D4AF37]">
          <Music size={16} />
          <span className="text-xs uppercase tracking-widest font-bold">Soundtrack</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://melodice.org/playlist/ra-1999/" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#D4AF37] transition-colors" title="In Melodice Browser-Tab öffnen (Fallback)">
             <ExternalLink size={16} />
          </a>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-black flex flex-col relative w-full">
         <div className="w-full h-[60%] bg-[#0f0f0f] relative">
            <YouTube 
               videoId={VIDEO_IDS[currentIndex]} 
               opts={{
                 width: '100%',
                 height: '100%',
                 playerVars: {
                   autoplay: 1, // Will try to autoplay if clicked next
                   controls: 1,
                   rel: 0,
                 }
               }}
               onReady={handleReady}
               onError={handleError}
               onStateChange={handleStateChange}
               onEnd={nextTrack}
               className="absolute inset-0 w-full h-full"
            />
         </div>
         
         <div className="flex-1 bg-[#1a1a1a] p-4 flex flex-col justify-center items-center text-center gap-3 border-t border-[#D4AF37]/10">
            {playerTitle && <p className="text-sm text-[#D4AF37] opacity-80">{playerTitle}</p>}
            <div className="flex items-center justify-between w-full px-4 mt-2">
               <div className="text-xs text-gray-500 font-mono">
                 Track {currentIndex + 1} / {VIDEO_IDS.length}
               </div>
               <button 
                 onClick={nextTrack} 
                 className="flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#333] border border-[#D4AF37]/30 text-[#D4AF37] px-4 py-2 rounded-full transition-transform active:scale-95 text-xs uppercase tracking-widest font-bold"
               >
                 <SkipForward size={14} /> Nächster
               </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-2">
              Hinweis: Melodice lässt sich nicht direkt einbetten. Falls das Abspielen abbricht, auf "Nächster" drücken oder den Link oben nutzen.
            </p>
         </div>
      </div>
    </div>
  );
}
