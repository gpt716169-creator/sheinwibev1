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
                <div
                    onClick={() => setIsSpinModalOpen(true)}
                    className="relative w-full h-24 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,215,0,0.15)] border border-[#FFD700]/30 group"
                >
                    {/* Фон */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1c2636] to-[#2a3441]"></div>
                    <div className="absolute inset-0 bg-[url('https://img.freepik.com/free-vector/casino-background-with-golden-coins_1017-38379.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>

                    {/* Контент */}
                    <div className="absolute inset-0 flex items-center justify-between px-6">
                        <div className="z-10">
                            <h3 className="text-[#FFD700] font-black text-xl uppercase italic drop-shadow-md">Daily Spin</h3>
                            <p className="text-white/60 text-xs max-w-[150px] leading-tight mt-1">Крути колесо и получай подарки каждые 24 часа!</p>
                        </div>
                        <div className="z-10 w-12 h-12 bg-[#FFD700] rounded-full flex items-center justify-center shadow-lg animate-bounce-slow text-black font-bold text-xl">
                            🎰
                        </div>
                    </div>

                    {/* Блик */}
                    <div className="absolute -inset-[100%] top-0 block w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                    {/* SWIPE MODE BANNER (NEW) */}
                    <div
                        onClick={() => setIsSwipeModeOpen(true)}
                        className="min-w-[140px] h-20 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 p-3 flex flex-col justify-between relative overflow-hidden group border border-white/10 cursor-pointer"
                    >
                        <div className="absolute -bottom-2 -right-2 text-4xl animate-bounce">🔥</div>
                        <span className="bg-white/20 self-start px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-sm">Tinder Mode</span>
                        <p className="text-white font-bold text-xs leading-tight z-10">Битва луков<br />Свайпай!</p>
                    </div>

                </div>

                {/* DROPS SECTION (NEW) */}
                <div className="px-6 mt-6 mb-2">
                    <div className="w-full bg-[#1c2636] rounded-2xl border border-white/5 overflow-hidden relative">
                        {/* Timer Badge */}
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 z-10 animate-pulse">
                            <span className="material-symbols-outlined text-xs">timer</span>
                            00:43:12
                        </div>

                        <div className="h-32 bg-cover bg-center" style={{ backgroundImage: "url('https://img.ltwebstatic.com/images3_pi/2023/11/08/90/1699413690fc101901a557b77ce225b27341fe2276_thumbnail_600x.webp')" }}>
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
                        </div>

                        <div className="absolute top-0 bottom-0 left-0 p-4 flex flex-col justify-center max-w-[60%]">
                            <h3 className="text-white font-black text-xl italic uppercase tracking-wider relative">
                                DROP #24
                                <span className="absolute -top-2 -right-3 text-xs text-yellow-400 rotate-12">Limited</span>
                            </h3>
                            <p className="text-white/60 text-xs mt-1 mb-3">Коллекция Y2K. Всего 50 единиц. Успей забрать.</p>
                            <button
                                onClick={() => window.Telegram?.WebApp?.showAlert("Дроп откроется через 43 минуты!")}
                                className="bg-white text-black font-bold text-xs px-4 py-2 rounded-lg self-start uppercase hover:scale-105 transition-transform"
                            >
                                Смотреть
                            </button>
                        </div>
                    </div>
                </div>

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
            </div>
        </div>
    );
}
