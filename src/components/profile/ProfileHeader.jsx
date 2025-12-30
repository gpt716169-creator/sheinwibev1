import React from 'react';

export default function ProfileHeader({ user, dbUser }) {

    // 1. Берем РЕАЛЬНЫЕ цифры из базы
    const totalSpent = Number(dbUser?.total_spent || 0); // Деньги (для статуса)
    const points = dbUser?.points || 0;                  // Баллы (просто показать)

    // 2. ЛОГИКА РАСЧЕТА СТАТУСА (Точь-в-точь как в LoyaltyCard)
    const getCalculatedStatus = (spent) => {
        if (spent >= 150000) return 'Platinum';
        if (spent >= 50000) return 'Gold';
        if (spent >= 15000) return 'Silver';
        return 'Bronze';
    };

    const currentStatus = getCalculatedStatus(totalSpent);

    // 3. СТИЛИ (Цвета для статусов)
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Platinum':
                return 'text-slate-200 bg-slate-500/20 border-slate-400/30 shadow-[0_0_15px_rgba(226,232,240,0.2)]';
            case 'Gold':
                return 'text-yellow-400 bg-yellow-500/10 border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.2)]';
            case 'Silver':
                return 'text-gray-300 bg-gray-500/10 border-gray-400/30 shadow-[0_0_10px_rgba(209,213,219,0.1)]';
            default: // Bronze
                return 'text-orange-400 bg-orange-500/10 border-orange-500/30 shadow-[0_0_10px_rgba(251,146,60,0.1)]';
        }
    };

    const [shake, setShake] = React.useState(false);

    const handleCardClick = () => {
        // Эффект тряски
        setShake(true);
        setTimeout(() => setShake(false), 500);

        // Вибрация
        window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');

        // Пасхалка: Алерт
        // window.Telegram?.WebApp?.showAlert("Снег стряхнули! ❄️");
    };

    return (
        <div className="flex flex-col items-center pt-8 pb-6 shrink-0 animate-scale-in">
            {/* АВАТАРКА */}
            <div className="w-24 h-24 rounded-full bg-cover bg-center border-4 border-[#102216] shadow-xl relative bg-[#2a3441]">
                <div className="absolute inset-0 rounded-full bg-cover bg-center" style={{ backgroundImage: user?.photo_url ? `url('${user.photo_url}')` : 'none' }}></div>
                {!user?.photo_url && <span className="material-symbols-outlined text-white/30 text-4xl absolute inset-0 flex items-center justify-center">person</span>}
            </div>

            {/* ИМЯ */}
            <h2 className="text-white text-xl font-bold mt-3">{user?.first_name}</h2>

            {/* ИНФО */}
            <div className="flex gap-2 mt-2">

                {/* СТАТУС (Интерактивный) */}
                <div onClick={handleCardClick} className={`relative cursor-pointer select-none transition-transform active:scale-95 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold border uppercase tracking-wider transition-all block ${getStatusStyle(currentStatus)}`}>
                        {currentStatus}
                    </span>
                    {/* Снежок на карточке (исчезает при тряске) */}
                    {!shake && (
                        <span className="absolute -top-1 -right-1 text-[10px] animate-pulse">❄️</span>
                    )}
                </div>

                {/* БАЛЛЫ (WIBE) */}
                <span className="px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary border border-primary/20">
                    {points} WIBE
                </span>
            </div>
            <style>{`
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: rotate(-5deg); }
                75% { transform: rotate(5deg); }
            }
         `}</style>
        </div>
    );
}
