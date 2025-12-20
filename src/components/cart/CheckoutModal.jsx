import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function CouponModal({ userId, subtotal, onClose, onApply, activeCouponCode }) {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [manualCode, setManualCode] = useState('');
    const [checking, setChecking] = useState(false);

    // Блокировка скролла основной страницы
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    // Загрузка купонов
    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const tgId = userId || 1332986231;
            const res = await fetch(`https://proshein.com/webhook/get-user-coupons?tg_id=${tgId}`);
            const json = await res.json();
            
            if (json.status === 'success') {
                setCoupons(json.coupons || []);
            }
        } catch (e) {
            console.error("Ошибка загрузки купонов:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = () => {
        if (!manualCode) return;
        setChecking(true);
        
        const codeUpper = manualCode.toUpperCase().trim();
        
        // 1. Ищем в загруженном списке
        const found = coupons.find(c => c.code === codeUpper);
        
        if (found) {
            onApply(found);
            setChecking(false);
            return;
        }

        // 2. Имитация проверки (позже заменишь на реальный fetch)
        setTimeout(() => {
            window.Telegram?.WebApp?.showAlert('Купон не найден или условия не выполнены');
            setChecking(false);
        }, 500);
    };

    // Рендерим через портал прямо в body
    return createPortal(
        <div 
            className="fixed inset-0 z-[99999] bg-[#101622] flex flex-col animate-slide-up" 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            {/* --- ШАПКА --- */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#101622] shrink-0 pt-safe-top">
                <button 
                    onClick={onClose} 
                    className="flex items-center gap-1 text-white/50 px-2 py-1 active:opacity-50 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back_ios</span>
                    <span className="text-sm font-medium">Назад</span>
                </button>
                <h2 className="text-white font-bold text-lg tracking-wide">Купоны</h2>
                <div className="w-16"></div> {/* Пустой блок для центровки заголовка */}
            </div>

            {/* --- КОНТЕНТ --- */}
            <div className="flex-1 overflow-y-auto p-5 pb-safe-bottom space-y-6">
                
                {/* Блок ввода промокода */}
                <div className="bg-surface-dark p-4 rounded-2xl border border-white/5 shadow-lg bg-[#1c2636]">
                    <p className="text-white/60 text-xs mb-3 font-medium uppercase tracking-wider ml-1">Есть промокод?</p>
                    <div className="flex gap-2">
                        <input 
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            className="custom-input flex-1 h-12 rounded-xl px-4 text-sm uppercase font-bold tracking-widest text-center placeholder:font-normal placeholder:tracking-normal placeholder:text-white/20 bg-[#101622] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white outline-none transition-all" 
                            placeholder="CODE" 
                        />
                        <button 
                            onClick={handleManualSubmit} 
                            disabled={!manualCode || checking}
                            className="bg-white/10 text-white w-12 rounded-xl flex items-center justify-center hover:bg-primary hover:text-[#102216] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {checking ? (
                                <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                            ) : (
                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Список купонов */}
                <div>
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2 px-1 text-sm uppercase tracking-wide opacity-80">
                        <span className="material-symbols-outlined text-primary text-[18px]">savings</span>
                        Ваши купоны
                    </h3>
                    
                    {loading ? (
                         <div className="space-y-3">
                             <div className="h-24 bg-white/5 rounded-xl animate-pulse"></div>
                             <div className="h-24 bg-white/5 rounded-xl animate-pulse"></div>
                         </div>
                    ) : coupons.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-10 opacity-50 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                             <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                             <p className="text-sm">Нет доступных купонов</p>
                         </div>
                    ) : (
                        <div className="space-y-3">
                            {coupons.map(c => {
                                const isActive = activeCouponCode === c.code;
                                const isApplicable = subtotal >= (c.min_order_amount || 0);
                                
                                return (
                                    <div 
                                        key={c.id || c.code} 
                                        onClick={() => isApplicable && onApply(c)}
                                        className={`relative overflow-hidden transition-all duration-300 group
                                            ${isApplicable ? 'cursor-pointer active:scale-[0.98]' : 'opacity-60 grayscale cursor-not-allowed'}
                                            ${isActive ? 'ring-2 ring-primary bg-primary/10' : 'bg-gradient-to-r from-[#1e293b] to-[#0f172a] border border-white/10'}
                                            rounded-xl p-0
                                        `}
                                    >
                                        <div className="flex h-full min-h-[90px]">
                                            {/* Левая часть (Сумма) */}
                                            <div className="w-[90px] flex flex-col items-center justify-center bg-black/20 border-r border-dashed border-white/10 relative shrink-0">
                                                 <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#101622] rounded-full"></div>
                                                 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#101622] rounded-full"></div>
                                                 
                                                 <span className={`text-lg font-black ${isApplicable ? 'text-white' : 'text-white/50'}`}>
                                                     {c.type === 'percent' ? `-${c.discount_amount}%` : `${c.discount_amount}₽`}
                                                 </span>
                                                 <span className="text-[8px] uppercase tracking-wider text-white/40 mt-0.5">Скидка</span>
                                            </div>

                                            {/* Правая часть (Инфо) */}
                                            <div className="flex-1 p-3 flex justify-between items-center relative overflow-hidden">
                                                <div className="absolute -right-2 -bottom-2 opacity-5 pointer-events-none rotate-12">
                                                    <span className="material-symbols-outlined text-[70px]">local_activity</span>
                                                </div>

                                                <div className="relative z-10">
                                                    <div className="bg-white/10 inline-block px-2 py-0.5 rounded text-[10px] font-mono text-primary/90 mb-1 border border-white/5 tracking-wider">
                                                        {c.code}
                                                    </div>
                                                    <p className="text-white/80 text-xs font-medium leading-tight max-w-[150px]">
                                                        {c.description || `Заказ от ${c.min_order_amount} ₽`}
                                                    </p>
                                                    {!isApplicable && (
                                                        <p className="text-red-400 text-[10px] mt-1 font-medium bg-red-500/10 px-1.5 py-0.5 rounded inline-block">
                                                            Еще {((c.min_order_amount || 0) - subtotal).toLocaleString()} ₽
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="relative z-10 pl-2">
                                                    {isActive ? (
                                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[#102216] shadow-[0_0_10px_rgba(19,236,91,0.4)]">
                                                            <span className="material-symbols-outlined text-lg font-bold">check</span>
                                                        </div>
                                                    ) : (
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${isApplicable ? 'border-white/20 text-white/20 group-hover:bg-white/10 group-hover:text-white' : 'border-white/5 text-transparent'}`}>
                                                            <span className="material-symbols-outlined text-lg">add</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
