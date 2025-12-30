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
            className="fixed inset-0 z-[99999] flex flex-col bg-[#101622] animate-slide-up"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            {/* Header Image Area */}
            <div className="relative h-[50vh] bg-white/5 shrink-0">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${item.image_url}')` }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#101622] to-transparent"></div>

                {/* Back Button */}
                <button
                    onClick={onClose}
                    className="absolute top-safe-top left-4 z-20 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:scale-95 transition-transform"
                    style={{ marginTop: '1rem' }}
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 -mt-10 relative z-10 px-6 flex flex-col h-full bg-[#101622] rounded-t-3xl border-t border-white/5">
                <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-6"></div>

                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-xl font-bold text-white flex-1 mr-4">{item.title}</h1>
                    <div className="flex flex-col items-end">
                        <span className={`text-2xl font-black ${item.currency === 'WIBE' ? 'text-purple-400' : 'text-primary'}`}>
                            {item.price} {item.currency === 'WIBE' ? 'Wibe' : '₽'}
                        </span>
                        <span className="text-sm text-white/40 line-through decoration-white/30">{item.original_price} ₽</span>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-xs text-white/70">
                        Размер: <span className="text-white font-bold">{item.size}</span>
                    </span>
                    <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-xs text-white/70">
                        Состояние: <span className="text-white font-bold">{item.condition}</span>
                    </span>
                </div>

                {/* Description */}
                <div className="space-y-4 overflow-y-auto mb-6 flex-1 pr-2">
                    <div>
                        <h3 className="text-white/40 text-[10px] uppercase font-bold mb-2">Описание</h3>
                        <p className="text-white/80 text-sm leading-relaxed">{item.description}</p>
                    </div>

                    <div>
                        <h3 className="text-white/40 text-[10px] uppercase font-bold mb-2">Доставка</h3>
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                            <span className="material-symbols-outlined text-primary text-lg">local_shipping</span>
                            {item.delivery_info}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="pb-safe-bottom py-4 border-t border-white/5">
                    {item.is_auction ? (
                        <div className="space-y-3">
                            {/* Timer & Bid Info */}
                            <div className="flex justify-between items-center bg-[#1c2636] p-3 rounded-xl border border-white/5">
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase font-bold">До конца аукциона</p>
                                    <p className="text-white font-mono font-bold text-lg animate-pulse">02:59:12</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-white/40 uppercase font-bold">Ставок</p>
                                    <p className="text-white font-bold">{item.bids_count || 0}</p>
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
                            <p className="text-center text-[10px] text-white/30">Минимальный шаг: 10%</p>
                        </div>
                    ) : item.currency === 'WIBE' ? (
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    window.Telegram?.WebApp?.showConfirm(`Купить этот товар за ${item.price} баллов Wibe?`, (ok) => {
                                        if (ok) window.Telegram?.WebApp?.showAlert('Запрос отправлен продавцу! (В разработке)');
                                    });
                                }}
                                className="w-full h-14 bg-purple-600 text-white font-black rounded-xl text-lg uppercase shadow-[0_0_20px_rgba(147,51,234,0.4)] active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">loyalty</span>
                                Купить за {item.price} Wibe
                            </button>
                            <p className="text-center text-[10px] text-white/30">Спишется с вашего баланса</p>
                        </div>
                    ) : (
                        <button
                            onClick={handleContactSeller}
                            className="w-full h-14 bg-white text-[#102216] font-black rounded-xl text-lg uppercase shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">chat</span>
                            Написать продавцу
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
