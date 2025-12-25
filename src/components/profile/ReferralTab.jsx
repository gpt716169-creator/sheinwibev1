import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/constants';

export default function ReferralTab({ userId }) {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalEarned, setTotalEarned] = useState(0);

    // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
    // Используем формат прямой ссылки на Mini App
    // 1. sheinwibebot (без подчеркивания)
    // 2. /app (Short Name из BotFather)
    // 3. ?startapp= (параметр для WebApp)
    const refLink = `https://t.me/sheinwibebot/app?startapp=ref_${userId}`;
    // -----------------------

    useEffect(() => {
        loadReferrals();
    }, [userId]);

    const loadReferrals = async () => {
        try {
            // Запрашиваем список приглашенных
            const res = await fetch(`${API_BASE_URL}/get-referrals?tg_id=${userId}`);
            const json = await res.json();

            if (json.referrals) {
                setFriends(json.referrals);
                // Считаем общий заработок (сумма поля 'earned_for_referrer' от каждого друга)
                const total = json.referrals.reduce((sum, f) => sum + (f.earned_for_referrer || 0), 0);
                setTotalEarned(total);
            }
        } catch (e) {
            console.error("Referral load error:", e);
        } finally {
            setLoading(false);
        }
    };

    const copyRefLink = () => {
        navigator.clipboard.writeText(refLink);
        // Вибрация при копировании
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        window.Telegram?.WebApp?.showAlert("Ссылка скопирована!");
    };

    return (
        <div className="px-6 space-y-6 animate-fade-in pb-10">

            {/* 1. ГЛАВНАЯ КАРТОЧКА (БАЛАНС) */}
            <div className="bg-gradient-to-br from-[#102216] to-[#0a150d] border border-primary/20 rounded-2xl p-6 text-center relative overflow-hidden shadow-lg">
                <div className="relative z-10">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Всего заработано с друзей</p>
                    <h2 className="text-4xl font-black text-primary mb-6">{Math.floor(totalEarned).toLocaleString()} ₽</h2>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors active:scale-[0.98]" onClick={copyRefLink}>
                        <div className="flex flex-col items-start overflow-hidden">
                            <span className="text-[10px] text-white/40 font-bold uppercase">Твоя ссылка</span>
                            <span className="text-xs text-white font-mono truncate w-full">{refLink}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(19,236,91,0.4)]">
                            <span className="material-symbols-outlined text-[#102216] text-sm font-bold">content_copy</span>
                        </div>
                    </div>
                </div>
                {/* Фон */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
            </div>

            {/* 2. УСЛОВИЯ */}
            <div className="flex gap-3">
                <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                    <h4 className="text-primary font-bold text-lg">1%</h4>
                    <p className="text-white/50 text-[10px] leading-tight mt-1">Кешбэк тебе с каждой покупки друга</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                    <h4 className="text-white font-bold text-lg">∞</h4>
                    <p className="text-white/50 text-[10px] leading-tight mt-1">Пожизненно со всех заказов</p>
                </div>
            </div>

            {/* 3. СПИСОК ДРУЗЕЙ */}
            <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 ml-1 opacity-50">
                    Приглашенные ({friends.length})
                </h3>

                {loading ? (
                    <div className="text-center text-white/30 text-xs py-4">Загрузка...</div>
                ) : friends.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/5">
                        <span className="material-symbols-outlined text-white/20 text-4xl mb-2">sentiment_dissatisfied</span>
                        <p className="text-white/50 text-xs">У тебя пока нет рефералов</p>
                        <p className="text-primary text-xs mt-1 font-bold">Отправь ссылку другу!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {friends.map((friend) => (
                            <div key={friend.id} className="bg-[#1c2636] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                                {/* Аватар */}
                                <div className="w-10 h-10 rounded-full bg-cover bg-center bg-white/10 shrink-0"
                                    style={{ backgroundImage: friend.photo_url ? `url('${friend.photo_url}')` : 'none' }}>
                                    {!friend.photo_url && <span className="material-symbols-outlined text-white/30 w-full h-full flex items-center justify-center">person</span>}
                                </div>

                                {/* Инфо */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-bold text-sm truncate">{friend.first_name}</h4>
                                    <p className="text-white/40 text-[10px]">
                                        Купил на: <span className="text-white/70">{friend.total_spent?.toLocaleString() || 0} ₽</span>
                                    </p>
                                </div>

                                {/* Доход с него */}
                                <div className="text-right">
                                    <p className="text-primary font-bold text-sm">+{Math.floor((friend.total_spent || 0) * 0.01)} ₽</p>
                                    <p className="text-primary/50 text-[9px] uppercase font-bold">Твой доход</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
