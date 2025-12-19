import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function LoyaltyModal({ totalSpent, onClose }) {
  
  // Блокируем скролл
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = 'auto';
  }, []);

  // Данные уровней
  const levels = [
    { name: 'Bronze', min: 0, max: 15000, cashback: '1%', color: 'text-orange-400', border: 'border-orange-500/30' },
    { name: 'Silver', min: 15000, max: 50000, cashback: '2%', color: 'text-gray-300', border: 'border-gray-400/30' },
    { name: 'Gold', min: 50000, max: 150000, cashback: '3%', color: 'text-yellow-400', border: 'border-yellow-500/30' },
    { name: 'Platinum', min: 150000, max: null, cashback: 'VIP', color: 'text-cyan-300', border: 'border-cyan-500/30' },
  ];

  return createPortal(
    <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
    >
      <div 
          className="bg-[#1c2636] w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="p-6 pb-4 border-b border-white/5 bg-[#151b26] flex justify-between items-center">
            <h3 className="text-white font-bold text-lg">Уровни лояльности</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white">
                <span className="material-symbols-outlined text-sm">close</span>
            </button>
        </div>

        {/* Список уровней (Скроллится внутри модалки) */}
        <div className="p-6 space-y-4 overflow-y-auto">
            {levels.map((lvl) => {
                const isCurrent = totalSpent >= lvl.min && (lvl.max === null || totalSpent < lvl.max);
                const isPassed = totalSpent >= (lvl.max || 999999999);
                
                return (
                    <div 
                        key={lvl.name} 
                        className={`relative p-4 rounded-2xl border ${lvl.border} bg-white/5 ${isCurrent ? 'ring-1 ring-white/20 bg-white/10' : ''} ${isPassed ? 'opacity-50' : ''}`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <h4 className={`font-black text-lg uppercase tracking-wider ${lvl.color}`}>{lvl.name}</h4>
                            <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded text-xs">Кэшбэк {lvl.cashback}</span>
                        </div>
                        <p className="text-white/40 text-xs">
                            Сумма выкупа: <span className="text-white font-mono">{lvl.min.toLocaleString()} - {lvl.max ? lvl.max.toLocaleString() : '∞'} ₽</span>
                        </p>
                        
                        {isCurrent && (
                            <div className="absolute top-2 right-2">
                                <span className="material-symbols-outlined text-primary text-xl drop-shadow-[0_0_5px_rgba(19,236,91,0.8)]">check_circle</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
        
        {/* Футер */}
        <div className="p-4 bg-[#151b26] border-t border-white/5 text-center">
            <p className="text-white/30 text-[10px]">Сумма выкупа обновляется после получения заказа</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
