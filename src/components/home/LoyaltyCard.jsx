import React, { useState } from 'react';

export default function LoyaltyCard({ points = 0, status = 'Bronze' }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Определение цвета и следующего уровня в зависимости от статуса
  const getStatusInfo = (currentStatus) => {
      const s = currentStatus.toLowerCase();
      if (s === 'platinum') return { next: 'Max', needed: 0, color: 'from-slate-300 via-slate-100 to-slate-300', text: 'text-slate-800' };
      if (s === 'gold') return { next: 'Platinum', needed: 5000 - points, color: 'from-yellow-600 via-yellow-400 to-yellow-600', text: 'text-yellow-900' };
      if (s === 'silver') return { next: 'Gold', needed: 2000 - points, color: 'from-gray-400 via-gray-200 to-gray-400', text: 'text-gray-800' };
      return { next: 'Silver', needed: 500 - points, color: 'from-orange-700 via-orange-400 to-orange-700', text: 'text-[#102216]' }; // Bronze
  };

  const info = getStatusInfo(status);
  
  // Процент заполнения прогресс-бара (условно)
  const progressPercent = Math.min(100, Math.max(0, (points / (points + info.needed)) * 100)) || 0;

  return (
    <div className="w-full h-48 perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* --- ЛИЦЕВАЯ СТОРОНА (БАЛЛЫ) --- */}
        <div className={`absolute inset-0 backface-hidden rounded-2xl p-6 bg-gradient-to-br ${info.color} shadow-[0_0_30px_rgba(255,255,255,0.1)] overflow-hidden flex flex-col justify-between`}>
            {/* Декор */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className={`font-bold text-sm uppercase tracking-widest opacity-70 ${info.text}`}>Wibe Balance</p>
                    <h2 className={`text-4xl font-black mt-1 ${info.text}`}>{points.toLocaleString()}</h2>
                </div>
                <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md`}>
                    <span className={`material-symbols-outlined text-xl ${info.text}`}>cached</span>
                </div>
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-end">
                    <span className={`font-bold text-lg uppercase tracking-wider ${info.text}`}>{status}</span>
                    <span className={`text-xs font-bold opacity-60 ${info.text}`}>Нажми, чтобы перевернуть</span>
                </div>
            </div>
        </div>

        {/* --- ОБРАТНАЯ СТОРОНА (УРОВЕНЬ) --- */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl p-6 bg-[#151c28] border border-white/10 shadow-xl overflow-hidden flex flex-col justify-between`}>
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold text-lg">Ваш уровень</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-white/70`}>{status}</span>
                </div>
                
                {info.next !== 'Max' ? (
                    <>
                        <p className="text-white/50 text-xs mb-2">До уровня <span className="text-white font-bold">{info.next}</span> осталось:</p>
                        <div className="flex items-end gap-1 mb-3">
                            <span className="text-primary font-bold text-2xl">{Math.max(0, info.needed)}</span>
                            <span className="text-primary/50 text-sm font-bold mb-1">WIBE</span>
                        </div>
                        {/* Прогресс бар */}
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-1000" style={{width: `${progressPercent}%`}}></div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-20">
                        <span className="material-symbols-outlined text-yellow-500 text-4xl mb-2">emoji_events</span>
                        <p className="text-white font-bold text-sm">Максимальный уровень!</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                 <span className="text-xs text-white/30">ID: 000{Math.floor(Math.random()*999)}</span>
                 <span className="text-xs text-primary font-bold">Подробнее о статусах</span>
            </div>
        </div>

      </div>
    </div>
  );
}
