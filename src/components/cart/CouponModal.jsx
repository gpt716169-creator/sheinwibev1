import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from '../../config/constants';

export default function CouponModal({ userId, subtotal, onClose, onApply, activeCouponCode }) {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [manualCode, setManualCode] = useState('');
    const [checking, setChecking] = useState(false);

    // --- 2. Блокируем скролл основной страницы ---
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => document.body.style.overflow = 'auto';
    }, []);

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const tgId = userId || 1332986231;
            // Убедись, что путь совпадает с твоим рабочим вебхуком
            const res = await fetch(`${API_BASE_URL}/get-user-coupons?tg_id=${tgId}`);
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
        const found = coupons.find(c => c.code === codeUpper);

        if (found) {
            onApply(found);
            setChecking(false);
            return;
        }

        window.Telegram?.WebApp?.showAlert('Купон не найден или недоступен');
        setChecking(false);
    };

    // --- 3. Оборачиваем всё в createPortal(..., document.body) ---
    return createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            {/* Фон (Backdrop) */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            {/* Контент модалки */}
            {/* Добавил mt-auto, чтобы на больших экранах выезжало снизу, а на телефоне было на весь экран */}
            <div className="relative z-10 flex flex-col w-full h-full bg-[#101622] md:h-auto md:max-h-[85vh] md:rounded-t-3xl md:mt-auto shadow-2xl">

                {/* --- ФИКСИРОВАННАЯ ВЕРХНЯЯ ЧАСТЬ --- */}
                <div className="bg-[#101622] z-20 border-b border-white/5 shrink-0 rounded-t-3xl">

                    {/* 1. Заголовок и Закрыть */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-2">
                        <button onClick={onClose} className="flex w-10 h-10 items-center justify-center rounded-full glass text-white hover:bg-white/10 active:scale-90 transition-transform">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h2 className="text-lg font-bold text-white tracking-wide">Купоны</h2>
                        <div className="w-10"></div> {/* Пустой блок для центровки */}
                    </div>

                    {/* 2. Поле ввода */}
                    <div className="px-6 pb-6 pt-2">
                        <div className="bg-[#1a2333] p-3 rounded-2xl border border-white/10">
                            <p className="text-white/50 text-[10px] mb-2 font-bold uppercase tracking-wider ml-1">Ввести промокод</p>
                            <div className="flex gap-2">
                                <input
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    className="custom-input flex-1 h-12 rounded-xl px-4 text-sm uppercase font-bold tracking-widest text-center placeholder:font-normal placeholder:tracking-normal placeholder:text-white/20 bg-[#101622] border-none focus:ring-1 focus:ring-primary/50"
                                    placeholder="CODE"
                                />
                                <button
                                    onClick={handleManualSubmit}
                                    disabled={!manualCode || checking}
                                    className="bg-white/10 text-white w-12 rounded-xl flex items-center justify-center hover:bg-primary hover:text-[#102216] transition-all disabled:opacity-30 active:scale-95"
                                >
                                    {checking ? (
                                        <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ПРОКРУЧИВАЕМАЯ ОБЛАСТЬ (СПИСОК) --- */}
                <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6 pb-safe-bottom">
                    <div>
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 px-1 text-sm uppercase tracking-wider text-white/50">
                            Доступные купоны
                        </h3>

                        {loading ? (
                            <div className="space-y-3">
                                <div className="h-24 bg-white/5 rounded-xl animate-pulse"></div>
                                <div className="h-24 bg-white/5 rounded-xl animate-pulse"></div>
                            </div>
                        ) : coupons.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50 border-2 border-dashed border-white/10 rounded-xl">
                                <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                                <p className="text-sm">Нет доступных купонов</p>
                            </div>
                        ) : (
                            <div className="space-y-3 pb-10">
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
                                                <div className="w-[90px] flex flex-col items-center justify-center bg-black/20 border-r border-dashed border-white/10 relative">
                                                    {/* Круги выреза */}
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#101622] rounded-full"></div>
                                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#101622] rounded-full"></div>

                                                    <span className={`text-lg font-black ${isApplicable ? 'text-white' : 'text-white/50'}`}>
                                                        {c.type === 'percent' ? `-${c.discount_amount}%` : `${c.discount_amount}₽`}
                                                    </span>
                                                </div>

                                                {/* Правая часть (Инфо) */}
                                                <div className="flex-1 p-3 pl-4 flex justify-between items-center relative overflow-hidden">
                                                    <div>
                                                        <div className="bg-white/10 inline-block px-2 py-0.5 rounded text-[10px] font-mono text-primary/90 mb-1 border border-white/5 tracking-wider">
                                                            {c.code}
                                                        </div>
                                                        <p className="text-white/80 text-xs font-medium leading-tight max-w-[140px]">
                                                            {c.description || `Заказ от ${c.min_order_amount} ₽`}
                                                        </p>
                                                        {!isApplicable && (
                                                            <p className="text-red-400 text-[10px] mt-1 font-bold">
                                                                Добавьте на {((c.min_order_amount || 0) - subtotal).toLocaleString()} ₽
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="z-10 ml-2">
                                                        {isActive ? (
                                                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[#102216] shadow-[0_0_10px_rgba(19,236,91,0.4)]">
                                                                <span className="material-symbols-outlined text-lg">check</span>
                                                            </div>
                                                        ) : (
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isApplicable ? 'border-white/20 text-white/20 group-hover:bg-white/10 group-hover:text-white' : 'border-white/5 text-transparent'}`}>
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
        </div>,
        document.body // <--- 4. Рендерим прямо в body
    );
}
