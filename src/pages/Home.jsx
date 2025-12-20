import React, { useState, useEffect } from 'react';
import LinkSearch from '../components/home/LinkSearch';
import ActiveOrders from '../components/home/ActiveOrders';
import LoyaltyCard from '../components/home/LoyaltyCard';
import LoyaltyModal from '../components/home/LoyaltyModal';
import FullScreenVideo from '../components/ui/FullScreenVideo'; 
import ReviewsBanner from '../components/home/ReviewsBanner'; 

export default function Home({ user, dbUser, setActiveTab }) {
  const [activeOrders, setActiveOrders] = useState([]);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
   
  // Состояние для видео-инструкции
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const TUTORIAL_VIDEO_URL = "https://storage.yandexcloud.net/videosheinwibe/vkclips_20251219084052.mp4";
   
  // Ссылка на VPN
  const VPN_LINK = "https://t.me/hitvpnbot?start=187358585644246";

  useEffect(() => {
    if (user?.id) {
        loadData();
    }
  }, [user]);

  const loadData = async () => {
      try {
          const res = await fetch(`https://proshein.com/webhook/get-orders?tg_id=${user?.id}`);
          const json = await res.json();
          setActiveOrders(json.orders || json.items || []);
      } catch (e) { console.error("Err loading orders", e); }
  };

  const handleSearch = async (link) => {
      window.Telegram?.WebApp?.MainButton.showProgress();
      try {
          const res = await fetch('https://proshein.com/webhook/parse-item', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ link, tg_id: user?.id })
          });
          const json = await res.json();
           
          if (json.status === 'success') {
              window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
              window.Telegram?.WebApp?.showAlert('Товар добавлен в корзину!');
          } else {
              window.Telegram?.WebApp?.showAlert('Ошибка: Не удалось найти товар');
          }
      } catch (e) {
          window.Telegram?.WebApp?.showAlert('Ошибка сети');
      } finally {
          window.Telegram?.WebApp?.MainButton.hideProgress();
      }
  };

  const openVpn = () => {
      // Используем нативный метод открытия ссылки внутри Telegram
      window.Telegram?.WebApp?.openTelegramLink(VPN_LINK);
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent animate-fade-in pb-28 overflow-y-auto">
        
        {/* HEADER */}
        <div className="pt-8 px-6 pb-6 flex items-center justify-between">
            <div>
                <h1 className="text-white text-2xl font-bold">Привет, {user?.first_name || 'Друг'}! 👋</h1>
                <p className="text-white/40 text-xs mt-1">Найдем твой стиль сегодня?</p>
            </div>
            <div onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-full bg-white/10 border border-white/10 bg-cover bg-center cursor-pointer" style={{backgroundImage: user?.photo_url ? `url('${user.photo_url}')` : 'none'}}>
                 {!user?.photo_url && <span className="material-symbols-outlined text-white/50 w-full h-full flex items-center justify-center">person</span>}
            </div>
        </div>

        <div className="px-6 space-y-8 relative z-0">
            
            {/* 1. ПОИСК */}
            <LinkSearch onSearch={handleSearch} />

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
                onGoToOrders={() => setActiveTab('profile')} 
            />

            {/* 4. БЛОК ССЫЛОК (Отзывы, Видео, VPN) */}
            <div className="space-y-3">
                {/* Заголовок "Помощь" убрали, теперь это общий список */}
                
                {/* Отзывы (Новый дизайн) */}
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

        {isTutorialOpen && (
            <FullScreenVideo 
                src={TUTORIAL_VIDEO_URL} 
                onClose={() => setIsTutorialOpen(false)} 
            />
        )}
    </div>
  );
}
