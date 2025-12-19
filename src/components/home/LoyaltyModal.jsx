import React from 'react';

export default function LoyaltyModal({ totalSpent, onClose }) {
  // Данные об уровнях
  const LEVELS_INFO = [
      { name: 'Bronze', range: '0 - 15 000 ₽', cashback: '1%', coupons: 'Обычные купоны', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
      { name: 'Silver', range: '15 000 - 50 000 ₽', cashback: '2%', coupons: 'Серебрянные купоны до 10% + Бесплатная доставка', color: 'text-gray-300', bg: 'bg-gray-400/10 border-gray-400/20' },
      { name: 'Gold', range: '50 000 - 150 000 ₽', cashback: '3%', coupons: 'Золотые купоны до 15%', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
      { name: 'Platinum', range: '> 150 000 ₽', cashback: '5%', coupons: 'Платиновые купоны до 20%', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  ];

  // Определяем текущий уровень для подсветки
  const getCurrentLevel = (spent) => {
      if (spent >= 150000) return 'Platinum';
      if (spent >= 50000) return 'Gold';
      if (spent >= 15000) return 'Silver';
      return 'Bronze';
  };
  
  const currentLevelName = getCurrentLevel(totalSpent);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
        <div className="bg-[#151c28] w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            
            {/* Заголовок */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#1a2332]">
                <h3 className="text-white font-bold text-lg">Уровни лояльности</h3>
                <button onClick={onClose} className="text-white/30 hover:text-white">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Список уровней */}
            <div className="p-5 overflow-y-auto space-y-4">
                {LEVELS_INFO.map((lvl) => (
                    <div key={lvl.name} className={`p-4 rounded-xl border ${lvl.bg} relative ${currentLevelName === lvl.name ? 'ring-1 ring-white/50 bg-white/5' : ''}`}>
                        {currentLevelName === lvl.name && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-bold uppercase text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[10px]">check</span> Ваш уровень
                            </div>
                        )}
                        <h4 className={`font-bold text-lg uppercase ${lvl.color} mb-1`}>{lvl.name}</h4>
                        <p className="text-white/40 text-[10px] mb-3 font-mono">{lvl.range}</p>
                        
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">payments</span>
                                <p className="text-white text-xs"><span className="opacity-60">Кешбэк:</span> <span className="font-bold">{lvl.cashback}</span></p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-emerald-400 text-sm">confirmation_number</span>
                                <p className="text-white text-xs leading-tight"><span className="opacity-60">Бонусы:</span> <span className="font-bold text-emerald-400">{lvl.coupons}</span></p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-5 border-t border-white/5 bg-[#151c28]">
                <button onClick={onClose} className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors">
                    Понятно
                </button>
            </div>
        </div>
    </div>
  );
}
