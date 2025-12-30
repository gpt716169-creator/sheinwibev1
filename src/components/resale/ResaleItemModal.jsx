import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ResaleItemModal({ item, onClose }) {

    // Lock scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => document.body.style.overflow = 'auto';
    }, []);

    if (!item) return null;

    const handleContactSeller = () => {
        // Открываем личку в телеграме
        // Используем tg://resolve?domain=USERNAME
        if (item.seller_tg) {
            window.open(`https://t.me/${item.seller_tg}`, '_blank');
        } else {
            window.Telegram?.WebApp?.showAlert('У продавца скрыт юзернейм');
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex flex-col bg-[#101622] animate-slide-up overflow-y-auto"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            {/* Scrollable Container */}
            <div className="flex-1 flex flex-col">
                {/* Header Image Area */}
                <div className="relative h-[60vh] shrink-0">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${item.image_url}')` }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101622] via-transparent to-black/30"></div>

                    {/* Back Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 z-20 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:scale-95 transition-transform mt-safe-top"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 -mt-10 relative z-10 px-6 flex flex-col bg-[#101622] rounded-t-3xl border-t border-white/5">
                    {/* Title & Price */}
                    <div className="flex justify-between items-start mb-6">
                        <h1 className="text-2xl font-black text-white flex-1 mr-4 leading-tight">{item.title}</h1>
                        <div className="flex flex-col items-end">
                            <span className={`text-2xl font-black ${item.currency === 'WIBE' ? 'text-purple-400' : 'text-primary'}`}>
                                {item.price} {item.currency === 'WIBE' ? 'Wibe' : '₽'}
                            </span>
                            <span className="text-sm text-white/40 line-through decoration-white/30">{item.original_price} ₽</span>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        <span className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-sm text-white/70">
                            Размер: <span className="text-white font-bold">{item.size}</span>
                        </span>
                        <span className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-sm text-white/70">
                            Состояние: <span className="text-white font-bold">{item.condition}</span>
                        </span>
                    </div>

                    <div className="w-full h-px bg-white/5 mb-8"></div>

                    {/* Description */}
                    <div className="space-y-8 mb-8 pb-32">
                        <div>
                            <h3 className="text-white/40 text-xs uppercase font-bold mb-3 tracking-wider">Описание</h3>
                            <p className="text-white/90 text-base leading-relaxed font-secondary">{item.description}</p>
                        </div>

                        <div>
                            <h3 className="text-white/40 text-xs uppercase font-bold mb-3 tracking-wider">Доставка</h3>
                            <div className="flex items-center gap-3 text-white/90 text-sm bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="material-symbols-outlined text-primary text-xl">local_shipping</span>
                                {item.delivery_info}
                            </div>
                        </div>
                    </div>

                    {/* Buttons Section (Bottom of Page) */}
                    <div className="py-8 mt-auto z-50 relative">
                        {item.is_auction ? (
                            <div className="space-y-4">
                                {/* Auction Timer Block */}
                                <div className="bg-[#1c2636] p-4 rounded-xl border border-white/5 flex justify-between items-center shadow-lg">
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase font-bold">До конца</p>
                                        <p className="text-white font-mono font-bold text-xl animate-pulse">02:59:12</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-lg text-xs font-bold">38 ставок</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        window.Telegram?.WebApp?.showConfirm(`Сделать ставку ${item.price * 1.1} ₽? (Это только тест)`, (ok) => {
                                            if (ok) window.Telegram?.WebApp?.showAlert('Ставка принята! (Визуально)');
                                        });
                                    }}
                                    className="w-full h-14 bg-orange-500 text-black font-black rounded-xl text-lg uppercase shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">gavel</span>
                                    Сделать ставку
                                </button>
                                <p className="text-center text-white/30 text-xs">Минимальный шаг: 10%</p>
                            </div>
                        ) : item.currency === 'WIBE' ? (
                            <button
                                onClick={() => {
                                    window.Telegram?.WebApp?.showConfirm(`Купить этот товар за ${item.price} баллов Wibe?`, (ok) => {
                                        if (ok) window.Telegram?.WebApp?.showAlert('Запрос отправлен продавцу!');
                                    });
                                }}
                                className="w-full h-14 bg-purple-600 text-white font-black rounded-xl text-lg uppercase shadow-[0_0_20px_rgba(147,51,234,0.4)] active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">loyalty</span>
                                Купить за {item.price} Wibe
                            </button>
                        ) : (
                            <button
                                onClick={handleContactSeller}
                                className="w-full h-14 bg-white text-[#102216] font-black rounded-xl text-lg uppercase shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">chat</span>
                                Написать продавцу
                            </button>
                        )}

                        {/* Safe area padding */}
                        <div className="h-6"></div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
