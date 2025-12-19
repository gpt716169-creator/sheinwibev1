import React from 'react';

export default function PaymentBlock({ 
    subtotal, 
    total, 
    discount, 
    pointsInput, 
    setPointsInput, 
    userPointsBalance, 
    handleUseMaxPoints, 
    onOpenCoupons, 
    onPay,
    onPlayVideo // <--- Новая функция
}) {
  return (
    <div className="space-y-4">
        {/* Промокоды и Баллы */}
        <div className="flex gap-3">
            <button onClick={onOpenCoupons} className={`flex-1 bg-dark-card border rounded-xl h-12 flex items-center justify-center gap-2 text-sm transition-colors ${discount > 0 ? 'border-primary text-primary' : 'border-white/10 text-white hover:bg-white/5'}`}>
                <span className="material-symbols-outlined text-[18px]">sell</span>
                {discount > 0 ? 'Скидка применена' : 'Промокод'}
            </button>
            <div className="relative flex-1">
                <input 
                    value={pointsInput}
                    onChange={(e) => setPointsInput(e.target.value)}
                    className="custom-input w-full rounded-xl px-4 h-12 text-sm text-center" 
                    type="number" 
                    placeholder="WIBE" 
                />
                <button onClick={handleUseMaxPoints} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary text-[10px] font-bold uppercase cursor-pointer px-2 py-1">MAX</button>
            </div>
        </div>

        {/* --- ВИДЕО КНОПКА --- */}
        <div onClick={onPlayVideo} className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-blue-500/20 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
            </div>
            <div className="flex-1">
                <p className="text-white text-xs font-bold">Таможня и паспорт</p>
                <p className="text-white/40 text-[10px]">Зачем это нужно? (1 мин)</p>
            </div>
            <span className="material-symbols-outlined text-white/30 text-[16px]">chevron_right</span>
        </div>
        {/* ------------------- */}

        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-sm"><span className="text-white/60">Товары</span><span className="text-white font-medium">{subtotal.toLocaleString()} ₽</span></div>
            {(discount > 0 || parseInt(pointsInput) > 0) && (
                <div className="flex justify-between items-center text-sm text-primary">
                    <span className="text-primary/60">Скидка</span>
                    <span className="font-medium">-{(discount + (parseInt(pointsInput)||0))} ₽</span>
                </div>
            )}
            <div className="flex justify-between items-center text-sm"><span className="text-white/60">Доставка</span><span className="text-primary font-medium">Бесплатно</span></div>
            <div className="h-px bg-white/10 my-2"></div>
            <div className="flex justify-between items-center"><span className="text-white font-semibold text-lg">Итого</span><span className="text-2xl font-bold text-primary">{total.toLocaleString()} ₽</span></div>
        </div>
        
        <button 
            onClick={onPay}
            className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center gap-3 text-white font-bold text-lg shadow-[0_0_25px_rgba(5,150,105,0.4)] active:scale-[0.98] transition-transform"
        >
            <span>Оплатить заказ</span>
            <span className="material-symbols-outlined">arrow_forward</span>
        </button>
    </div>
  );
}
