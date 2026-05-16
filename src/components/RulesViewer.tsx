import React, { useState } from 'react';
import { X, Book, Users, Play, AlertTriangle, Star, Trophy, Gavel } from 'lucide-react';

const TABS = [
  { id: 'ziel', label: 'Spielziel', icon: <Book size={18} /> },
  { id: 'verlauf', label: 'Spielverlauf', icon: <Play size={18} /> },
  { id: 'bietrunde', label: 'Bietrunde', icon: <Gavel size={18} /> },
  { id: 'ereignisse', label: 'Katastrophen & Ende', icon: <AlertTriangle size={18} /> },
  { id: 'wertung', label: 'Wertung Epoche', icon: <Star size={18} /> },
  { id: 'endwertung', label: 'Spielende', icon: <Trophy size={18} /> },
];

export function RulesViewer({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl h-[90vh] bg-[#151515] rounded-xl border border-[#D4AF37]/40 shadow-2xl flex flex-col overflow-hidden text-[#e0e0e0]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 bg-[#1a1a1a] border-b border-[#D4AF37]/20 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 border border-[#D4AF37] rotate-45 flex items-center justify-center">
               <span className="-rotate-45 font-serif text-[#D4AF37] font-bold leading-none text-sm">RA</span>
             </div>
             <h2 className="text-xl font-serif text-[#D4AF37] uppercase tracking-widest">Spielregeln</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-red-900/20 text-red-400 hover:bg-red-900/60 hover:text-red-300 rounded transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="md:w-64 bg-[#111] border-b md:border-b-0 md:border-r border-[#D4AF37]/10 flex md:flex-col overflow-x-auto md:overflow-y-auto shrink-0 custom-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full text-left p-4 uppercase tracking-widest text-xs font-bold transition-colors whitespace-nowrap md:whitespace-normal border-l-2 ${
                  activeTab === tab.id 
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]' 
                    : 'text-gray-500 border-transparent hover:bg-[#222] hover:text-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar relative">
            <div className="max-w-3xl mx-auto space-y-6 font-sans leading-relaxed text-sm sm:text-base">
              
              {activeTab === 'ziel' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <h3 className="text-2xl font-serif text-[#D4AF37] uppercase tracking-widest border-b border-[#D4AF37]/20 pb-2">Spielziel</h3>
                  <p>Ra ist der altägyptische Sonnengott, der in der ägyptischen Mythologie jeden Abend mit dem Boot durch die Unterwelt reist. Apophis, der schlangenförmige Gott des Chaos, versucht, Ra an dessen Reise zu hindern. Ra besiegt die Angriffe stets, und als Beweis dafür geht jeden Morgen eine neue Sonne auf.</p>
                  <p>Das Spiel verläuft über drei Epochen, die die bewegte Geschichte des alten Ägypten widerspiegeln:</p>
                  <ul className="list-disc pl-6 space-y-2 text-[#D4AF37]/80">
                    <li><strong className="text-[#D4AF37]">Das Alte Reich</strong> (2665 - 2155 v. Chr.)</li>
                    <li><strong className="text-[#D4AF37]">Das Mittlere Reich</strong> (2130 - 1650 v. Chr.)</li>
                    <li><strong className="text-[#D4AF37]">Das Neue Reich</strong> (1555 - 1080 v. Chr.)</li>
                  </ul>
                  <p>Während dieser Epochen bieten die Spieler um Plättchen, welche die unterschiedlichen Aspekte des Lebens im alten Ägypten darstellen. Bei den Versteigerungen bieten die Spieler mit Sonnen – Steine, die sie von Ra erhalten. Die Auswahl der Plättchen ändert sich bei jeder Versteigerung, und die Anzahl der Sonnen ist beschränkt.</p>
                  <div className="bg-[#D4AF37]/10 border-l-4 border-[#D4AF37] p-4 text-[#D4AF37] font-bold">
                    Der Spieler, der nach den drei Epochen die meisten Ruhmespunkte erlangt hat, ist Sieger.
                  </div>
                </div>
              )}

              {activeTab === 'verlauf' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <h3 className="text-2xl font-serif text-[#D4AF37] uppercase tracking-widest border-b border-[#D4AF37]/20 pb-2">Spielverlauf</h3>
                  <p>Der Spieler mit der höchsten Sonne beginnt. Danach geht es reihum im Uhrzeigersinn weiter. Wer an der Reihe ist, muss genau eine der folgenden Aktionen ausführen:</p>
                  <ul className="list-disc pl-6 space-y-3 text-[#e0e0e0]">
                    <li><strong className="text-[#D4AF37]">Ein Plättchen ziehen und auf den Spielplan legen:</strong> Zieht man ein Plättchen aus dem Beutel, legt man es in die Angebotsreihe. Zieht man ein Ra-Plättchen, kommt es in die Ra-Reihe und eine Bietrunde startet.</li>
                    <li><strong className="text-[#D4AF37]">Götterplättchen einsetzen:</strong> Man darf beliebig viele Götterplättchen abgeben, um sich für jedes abgegebene Götterplättchen sofort ein Plättchen aus der Angebotsreihe zu nehmen.</li>
                    <li><strong className="text-[#D4AF37]">Ra anrufen:</strong> Anstatt zu ziehen, ruft man "Ra" und startet freiwillig eine Bietrunde.</li>
                  </ul>
                  <div className="bg-red-900/20 border-l-4 border-red-500 p-4 text-red-200">
                    <strong>Achtung:</strong> Hat ein Spieler keine offene Sonne mehr (weil er alle verbraucht hat), darf er in dieser Epoche keine Aktion mehr ausführen!
                  </div>
                  <h4 className="text-lg font-serif text-[#D4AF37] mt-8">Angebotsreihe voll</h4>
                  <p>Wenn alle 8 Felder der Angebotsreihe belegt sind, darf der Spieler kein Plättchen mehr ziehen! Er kann nur Götterplättchen einsetzen oder zwingend Ra anrufen.</p>
                </div>
              )}

              {activeTab === 'bietrunde' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <h3 className="text-2xl font-serif text-[#D4AF37] uppercase tracking-widest border-b border-[#D4AF37]/20 pb-2">Die Bietrunde</h3>
                  <p>Der Spieler, dessen Aktion zur Bietrunde geführt hat (entweder durch Ziehen eines Ra-Plättchens oder durch freiwilligen Anruf), ist der Ra-Spieler. Die Bietrunde beginnt links vom Ra-Spieler, verläuft im Uhrzeigersinn und endet beim Ra-Spieler.</p>
                  
                  <div className="bg-[#222] p-4 rounded border border-[#333]">
                    <h4 className="text-[#D4AF37] font-bold mb-2">Ablauf des Bietens</h4>
                    <p>Jeder Spieler darf den Wert einer seiner offenen Sonnen bieten. Jedes neue Gebot muss höher sein als das vorhergehende. Man darf auch passen.</p>
                  </div>

                  <h4 className="text-lg font-serif text-[#D4AF37] mt-6">Wer erhält den Zuschlag?</h4>
                  <p>Der Spieler, der die höchste Sonne geboten hat, erhält <strong>alle Plättchen aus der Angebotsreihe</strong> und legt sie offen vor sich aus.</p>
                  <p>Außerdem erhält der Sieger die <strong>Sonne aus der Spielplanmitte</strong> (diese wird verdeckt und kann erst in der nächsten Epoche genutzt werden). Die Sonne, mit der er geboten hat, legt er stattdessen in die Mitte.</p>

                  <h4 className="text-lg font-serif text-[#D4AF37] mt-6">Zwang zum Bieten</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Wurde die Bietrunde durch <strong>freiwilliges Anrufen</strong> gestartet, <span className="underline">muss</span> der Ra-Spieler bieten, falls alle anderen passen.</li>
                    <li>Wurde die Bietrunde durch <strong>Ziehen eines Ra-Plättchens</strong> oder weil die <strong>Angebotsreihe voll</strong> war ausgelöst, darf auch der Ra-Spieler passen.</li>
                  </ul>
                  <p className="text-sm text-gray-400">Passen alle Spieler, wenn die Angebotsreihe voll war, kommen alle Plättchen in der Angebotsreihe aus dem Spiel!</p>
                </div>
              )}

              {activeTab === 'ereignisse' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <h3 className="text-2xl font-serif text-[#D4AF37] uppercase tracking-widest border-b border-[#D4AF37]/20 pb-2">Katastrophen</h3>
                  <p>Ersteigert ein Spieler eine Katastrophe, muss er sofort entsprechende Plättchen abwerfen:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#222] p-4 rounded border border-red-900/50">
                      <strong className="text-red-400 block mb-1">Begräbnis</strong>
                      <span className="text-sm">2 Pharaonen abwerfen</span>
                    </div>
                    <div className="bg-[#222] p-4 rounded border border-red-900/50">
                      <strong className="text-red-400 block mb-1">Dürre</strong>
                      <span className="text-sm">2 Überschwemmungen oder Nil-Plättchen abwerfen (zuerst Überschwemmungen)</span>
                    </div>
                    <div className="bg-[#222] p-4 rounded border border-red-900/50">
                      <strong className="text-red-400 block mb-1">Unruhen</strong>
                      <span className="text-sm">2 Zivilisationsplättchen abwerfen (freie Wahl)</span>
                    </div>
                    <div className="bg-[#222] p-4 rounded border border-red-900/50">
                      <strong className="text-red-400 block mb-1">Erdbeben</strong>
                      <span className="text-sm">2 Monumente abwerfen (freie Wahl)</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-serif text-[#D4AF37] uppercase tracking-widest border-b border-[#D4AF37]/20 pb-2 mt-12">Ende einer Epoche</h3>
                  <p>Eine Epoche endet sofort in zwei Fällen:</p>
                  <ul className="list-decimal pl-6 space-y-2">
                    <li><strong>Alle Sonnen verbraucht:</strong> Wenn der letzte Spieler seine letzte Sonne eingesetzt hat.</li>
                    <li><strong>Ra-Reihe voll:</strong> Wenn das letzte Feld der Ra-Reihe belegt wird. In diesem Fall gibt es <em>keine Bietrunde</em> mehr! Die Angebotsreihe kommt aus dem Spiel.</li>
                  </ul>
                  <p>Anschließend folgt die Epochenwertung.</p>
                </div>
              )}

              {activeTab === 'wertung' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <h3 className="text-2xl font-serif text-[#D4AF37] uppercase tracking-widest border-b border-[#D4AF37]/20 pb-2">Wertung nach jeder Epoche</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-bold text-[#D4AF37]">Pharaonen</h4>
                      <p>Der Spieler mit den <strong>meisten</strong> Pharaonen erhält <strong>5 Punkte</strong>. Der Spieler mit den <strong>wenigsten</strong> verliert <strong>2 Punkte</strong>. (Pharaonen bleiben liegen).</p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-bold text-[#D4AF37]">Nil & Überschwemmung</h4>
                      <p>Jeder Spieler erhält <strong>1 Punkt</strong> für jedes Nil- und jedes Überschwemmungsplättchen – allerdings <em>nur, wenn er mindestens 1 Überschwemmungsplättchen besitzt!</em></p>
                      <p className="text-sm text-gray-400">Überschwemmungen werden danach abgeworfen, Nil-Plättchen bleiben liegen.</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-[#D4AF37]">Zivilisation</h4>
                      <p>Wer <strong>kein einziges</strong> Zivilisationsplättchen besitzt, <strong>verliert 5 Punkte</strong>. Sonst:</p>
                      <ul className="list-disc pl-6 text-sm mt-2">
                        <li>3 verschiedene = +5 Punkte</li>
                        <li>4 verschiedene = +10 Punkte</li>
                        <li>5 verschiedene = +15 Punkte</li>
                      </ul>
                      <p className="text-sm text-gray-400 mt-2">Alle genutzten Zivilisationen werden abgeworfen.</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-[#D4AF37]">Götter</h4>
                      <p>Jedes <span className="underline">nicht eingesetzte</span> Götterplättchen bringt <strong>2 Punkte</strong>. Wird danach abgeworfen.</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-[#D4AF37]">Gold</h4>
                      <p>Jedes Goldplättchen bringt <strong>3 Punkte</strong>. Wird danach abgeworfen.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'endwertung' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <h3 className="text-2xl font-serif text-[#D4AF37] uppercase tracking-widest border-b border-[#D4AF37]/20 pb-2">Spielende und Endwertung</h3>
                  <p>Nach der Wertung der dritten Epoche endet das Spiel. Zusätzlich zur normalen Epochenwertung erhalten die Monumente und Sonnen jetzt noch Punkte.</p>
                  
                  <div>
                    <h4 className="text-lg font-bold text-[#D4AF37] mb-2">Monumente</h4>
                    <p className="mb-2">Monumente werden <span className="underline">nur am Spielende</span> gewertet. Es gibt 8 verschiedene Arten.</p>
                    <ul className="list-disc pl-6 space-y-1 mb-4">
                      <li>1 bis 6 verschiedene Monumente = 1 bis 6 Punkte</li>
                      <li>7 verschiedene = <strong>10 Punkte</strong></li>
                      <li>8 verschiedene = <strong>15 Punkte</strong></li>
                    </ul>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>3 gleiche Monumente = <strong>5 Punkte</strong></li>
                      <li>4 gleiche = <strong>10 Punkte</strong></li>
                      <li>5 gleiche = <strong>15 Punkte</strong></li>
                    </ul>
                    <p className="text-sm text-gray-400 mt-2">Punkte für 'Verschiedene' und 'Gleiche' werden addiert!</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-[#D4AF37] mb-2">Sonnen</h4>
                    <p>Jeder Spieler addiert die Zahlen auf seinen Sonnen (offen und verdeckt).</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Höchste Gesamtsumme = <strong>+5 Punkte</strong></li>
                      <li>Niedrigste Gesamtsumme = <strong>-5 Punkte</strong></li>
                    </ul>
                  </div>

                  <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-6 rounded text-center mt-8">
                    <h4 className="text-xl font-serif text-[#D4AF37] mb-2">Sieger</h4>
                    <p>Wer nach der Zusammenrechnung aller Punkte das höchste Ergebnis hat, gewinnt. Bei Gleichstand entscheidet die höchste Sonne.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

