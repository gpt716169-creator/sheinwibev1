import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LinkSearch from '../components/home/LinkSearch';
import ActiveOrders from '../components/home/ActiveOrders';
import LoyaltyCard from '../components/home/LoyaltyCard';
import LoyaltyModal from '../components/home/LoyaltyModal';
import FullScreenVideo from '../components/ui/FullScreenVideo';
import ReviewsBanner from '../components/home/ReviewsBanner';
import { LINKS, ROUTES } from '../config/constants';
import { useAppContext } from '../context/AppContext';
import { useOrders } from '../hooks/useOrders';
import { useSearch } from '../hooks/useSearch';

import DailySpinModal from '../components/home/DailySpinModal';
import SwipeMode from '../components/home/SwipeMode';

export default function Home() {
    const { tgUser: user, dbUser, refreshUser } = useAppContext(); // Добавил refreshUser если нужно обновить баллы
    const navigate = useNavigate();
    const { activeOrders } = useOrders(user?.id);
    const { handleSearch } = useSearch(user?.id);
    const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
    const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
    const [isSwipeModeOpen, setIsSwipeModeOpen] = useState(false); // New State

    // Состояние для видео-инструкции
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);

    const openVpn = () => {
        window.Telegram?.WebApp?.openTelegramLink(LINKS.VPN_BOT);
    };

    const openShein = () => {
        if (window.Telegram?.WebApp?.openLink) {
            window.Telegram.WebApp.openLink(LINKS.SHEIN_APP_JUMP, { try_instant_view: false });
        } else {
            window.open(LINKS.SHEIN_APP_JUMP, '_blank');
        }
    };

    const handleSpinWin = async (prize) => {
        // Здесь можно отправить запрос на бэкэнд
        console.log("Won prize:", prize);

        // Показываем конфетти или алерт
        // window.Telegram?.WebApp?.showAlert(`Поздравляем! Вы выиграли: ${prize.label}`);

        // Мок: если баллы, обновляем локально (в идеале - запрос в базу)
        // if (prize.value.includes('points')) { ... }
    };

    // --- RENDER ---
    return (
        <div className="flex flex-col min-h-screen bg-transparent animate-fade-in pb-28 overflow-y-auto">

            {/* HEADER */}
            <div className="pt-8 px-6 pb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-white text-2xl font-bold">Привет, {user?.first_name || 'Друг'}! 👋</h1>
                    <p className="text-white/40 text-xs mt-1">Найдем твой стиль сегодня?</p>
                </div>
                <div onClick={() => navigate(ROUTES.PROFILE)} className="w-10 h-10 rounded-full bg-white/10 border border-white/10 bg-cover bg-center cursor-pointer" style={{ backgroundImage: user?.photo_url ? `url('${user.photo_url}')` : 'none' }}>
                    {!user?.photo_url && <span className="material-symbols-outlined text-white/50 w-full h-full flex items-center justify-center">person</span>}
                </div>
            </div>

            <div className="px-6 space-y-8 relative z-0">

                {/* 1. ПОИСК */}
                <LinkSearch onSearch={handleSearch} />

                {/* 1.5 КОЛЕСО ФОРТУНЫ (Баннер) */}
                {/* 1.5 КОЛЕСО ФОРТУНЫ - Удалено из топа */}

                {/* DROPS SECTION - Удалено из топа */}

                <div className="px-6 space-y-8 relative z-0 mt-6">



                    {/* 2. КАРТА ЛОЯЛЬНОСТИ */}
                    <div className="relative z-10">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 ml-1 opacity-50">Мой уровень</h3>
                        <LoyaltyCard
                            points={parseInt(dbUser?.points) || 0}
                            totalSpent={parseInt(dbUser?.total_spent) || 0}
                            onOpenDetails={() => setIsLoyaltyModalOpen(true)}
                        />
                    </div>

                    {/* 3. АКТИВНЫЕ ЗАКАЗЫ */}
                    <ActiveOrders
                        orders={activeOrders}
                        onGoToOrders={() => navigate(ROUTES.PROFILE)}
                    />

                    {/* 4. БЛОК ССЫЛОК */}
                    <div className="space-y-3">
                        {/* Отзывы */}
                        <ReviewsBanner />

                        {/* Видео */}
                        <div
                            onClick={() => setIsTutorialOpen(true)}
                            className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors active:scale-[0.98]"
                        >
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary relative shrink-0">
                                <span className="material-symbols-outlined">play_arrow</span>
                                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75"></div>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold text-sm">Как это работает?</h4>
                                <p className="text-white/40 text-xs">Видео-инструкция (45 сек)</p>
                            </div>
                            <span className="material-symbols-outlined text-white/20">chevron_right</span>
                        </div>

                        {/* --- КНОПКА: SHEIN APP --- */}
                        <div
                            onClick={openShein}
                            className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-black/80 transition-colors active:scale-[0.98]"
                        >
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-extrabold text-lg shrink-0">
                                S
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold text-sm">Перейти в SHEIN</h4>
                                <p className="text-white/40 text-xs">Выбрать товары в приложении</p>
                            </div>
                            <span className="material-symbols-outlined text-white/20">open_in_new</span>
                        </div>

                        {/* VPN */}
                        <div
                            onClick={openVpn}
                            className="bg-[#1e2a4a]/40 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-[#1e2a4a]/60 transition-colors active:scale-[0.98]"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                <span className="material-symbols-outlined">vpn_lock</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold text-sm">Не грузит SHEIN?</h4>
                                <p className="text-white/40 text-xs">Включи быстрый VPN для доступа</p>
                            </div>
                            <span className="material-symbols-outlined text-white/20">open_in_new</span>
                        </div>
                    </div>

                    {/* --- FEATURES BUTTONS (BOTTOM) --- */}
                    {/* --- FEATURES BUTTONS (BOTTOM) --- */}
                    <div className="space-y-3 mt-4">
                        {/* 1. DROP */}
                        <div
                            onClick={() => window.Telegram?.WebApp?.showAlert("DROP #24: Oткроется через 43 минуты!")}
                            className="bg-gradient-to-r from-[#1c2636] to-[#2a3441] border border-white/10 rounded-2xl p-4 flex items-center gap-4 cursor-pointer relative overflow-hidden group active:scale-[0.98] transition-all"
                        >
                            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl relative z-10">
                                ⚡️
                            </div>
                            <div className="flex-1 relative z-10">
                                <h4 className="text-white font-bold text-sm">Limited Drop</h4>
                                <p className="text-white/40 text-xs">Эксклюзивные товары. Успей забрать</p>
                            </div>
                            <span className="material-symbols-outlined text-white/20">chevron_right</span>
                        </div>

                        {/* 2. SWIPE */}
                        <div
                            onClick={() => setIsSwipeModeOpen(true)}
                            className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-4 cursor-pointer relative overflow-hidden group active:scale-[0.98] transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-xl relative z-10">
                                🔥
                            </div>
                            <div className="flex-1 relative z-10">
                                <h4 className="text-white font-bold text-sm">Битва луков</h4>
                                <p className="text-white/40 text-xs">Свайпай и выбирай лучшее</p>
                            </div>
                            <span className="material-symbols-outlined text-white/20">chevron_right</span>
                        </div>

                        {/* 3. WHEEL */}
                        <div
                            onClick={() => setIsSpinModalOpen(true)}
                            className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-4 flex items-center gap-4 cursor-pointer relative overflow-hidden group active:scale-[0.98] transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-xl relative z-10">
                                ☸️
                            </div>
                            <div className="flex-1 relative z-10">
                                <h4 className="text-white font-bold text-sm">Daily Spin</h4>
                                <p className="text-white/40 text-xs">Испытай удачу и выиграй призы</p>
                            </div>
                            <span className="material-symbols-outlined text-white/20">chevron_right</span>
                        </div>
                    </div>

                </div>

                {/* --- МОДАЛКИ --- */}
                {isLoyaltyModalOpen && (
                    <LoyaltyModal
                        totalSpent={dbUser?.total_spent || 0}
                        onClose={() => setIsLoyaltyModalOpen(false)}
                    />
                )}

                {/* Daily Spin */}
                {isSpinModalOpen && (
                    <DailySpinModal
                        onClose={() => setIsSpinModalOpen(false)}
                        onWin={handleSpinWin}
                    />
                )}

                {isTutorialOpen && (
                    <FullScreenVideo
                        src={LINKS.TUTORIAL_VIDEO}
                        onClose={() => setIsTutorialOpen(false)}
                    />
                )}

                {/* Swipe Mode */}
                {isSwipeModeOpen && (
                    <SwipeMode
                        onClose={() => setIsSwipeModeOpen(false)}
                    />
                )}
            </div>
        </div>
    );
}
