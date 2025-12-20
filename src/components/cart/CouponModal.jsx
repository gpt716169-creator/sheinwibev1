import React, { useState, useEffect } from 'react';

export default function CouponModal({ userId, subtotal, onClose, onApply, activeCouponCode }) {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [manualCode, setManualCode] = useState('');
    const [checking, setChecking] = useState(false);

    // Загрузка списка доступных купонов при открытии
    useEffect(() => {
        loadCoupons();
        // Блокируем прокрутку основной страницы, пока открыто модальное окно
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const tgId = userId || 1332986231; // fallback для тестов
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

    // Обработка ручного ввода
    const handleManualSubmit = () => {
        if (!manualCode) return;
        setChecking(true);
        
        const codeUpper = manualCode.toUpperCase().trim();
        
        // 1. Сначала ищем в уже загруженном списке
        const found = coupons.find(c => c.code === codeUpper);
        
        if (found) {
            onApply(found);
            setChecking(false);
            return;
        }

        // 2. Имитация проверки на бэкенде
        setTimeout(() => {
            window.Telegram?.WebApp?.showAlert('Купон не найден или недоступен');
            setChecking(false);
        }, 500);
    };

    return (
        // ВАЖНО: fixed positioning относительно viewpor (экрана), z-index выше всего
        <div className="fixed top-0 left-0 right-0 z-[9999] w-full h-[100dvh] flex flex-col animate-fade-in">
            
            {/* Backdrop (затемнение фона) */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
            
            {/* Content Container */}
            {/* На мобильном: h-full (во весь экран). На десктопе: центрируем или делаем как шторку */}
            <div className="relative z-10 flex flex-col w-full h-full bg-[#101622] md:max-w-md md:h-auto md:max-h-[85vh] md:m-auto md:rounded-2xl border-none shadow-2xl">
                
                {/* Header - Всегда сверху экрана */}
                <div className="flex items-center justify-between p-6 pt-8 pb-4 border-b border-white/5 bg-[#101622] shrink-0">
                    <button 
                        onClick={onClose} 
                        className="flex w-10 h-10 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <h2 className="text-lg font-bold text-white tracking-wide">Купоны</h2>
                    <div className="w-10"></div> {/* Spacer для центровки заголовка */}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Input Block */}
                    <div className="bg-surface-dark p-4 rounded-2xl border border-white/5 shadow-lg bg-[#1c2636]">
                        <p className="text-white/60 text-xs mb-3 font-medium uppercase tracking-wider ml-1">Есть промокод?</p>
                        <div className="flex gap-2">
                            <input 
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                className="custom-input flex-1 h-12 rounded-xl px-4 text-sm uppercase font-bold tracking-widest text-center placeholder:font-normal placeholder:tracking-normal placeholder:text-white/20 bg-[#101622] border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white outline-none transition-all" 
                                placeholder="ВВЕСТИ КОД" 
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

                    {/* Coupons List */}
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
                            <div className="space-y-3 pb-safe"> {/* pb-safe для отступа снизу на iPhone */}
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
                                                {/* Left part (Amount) */}
                                                <div className="w-[90px] flex flex-col items-center justify-center bg-black/20 border-r border-dashed border-white/10 relative shrink-0">
                                                     {/* Cutout circles decoration */}
                                                     <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#101622] rounded-full"></div>
                                                     <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#101622] rounded-full"></div>
                                                     
                                                     <span className={`text-lg font-black ${isApplicable ? 'text-white' : 'text-white/50'}`}>
                                                         {c.type === 'percent' ? `-${c.discount_amount}%` : `${c.discount_amount}₽`}
                                                     </span>
                                                     <span className="text-[8px] uppercase tracking-wider text-white/40 mt-0.5">Скидка</span>
                                                </div>

                                                {/* Right part (Info) */}
                                                <div className="flex-1 p-3 flex justify-between items-center relative overflow-hidden">
                                                    {/* Background icon */}
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
            </div>
        </div>
    );
}
