import React, { useState, useEffect } from 'react';

// Конфигурация уровней (для красоты карточки)
const TIERS = [
  { id: 'bronze', name: 'Bronze', limit: 0, color: 'text-[#cd7f32]', bgFrom: 'from-[#451a03]', benefits: ['Базовый уровень'] },
  { id: 'silver', name: 'Silver', limit: 15000, color: 'text-gray-300', bgFrom: 'from-[#334155]', benefits: ['Больше купонов', 'Кэшбэк 1.5%'] },
  { id: 'gold', name: 'Gold', limit: 50000, color: 'text-yellow-400', bgFrom: 'from-[#854d0e]', benefits: ['Скидка 5%', 'Кэшбэк 2%', 'Excl. купоны'] },
  { id: 'platinum', name: 'Platinum', limit: 100000, color: 'text-cyan-400', bgFrom: 'from-[#164e63]', benefits: ['Скидка 10%', 'Кэшбэк 3%', 'VIP подарки'] }
];

export default function Home({ user, dbUser, setActiveTab }) {
  const [link, setLink] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null); // Самый свежий заказ
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Определяем текущий уровень
  const currentTier = TIERS.find(t => t.name === dbUser?.status) || TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];
  
  // Баллы: если новый юзер, показываем 500, иначе реальные
  const displayPoints = dbUser ? (dbUser.points == 0 ? 500 : dbUser.points) : 0;
  
  // Прогресс бар
  const totalSpent = 0; 
  let progressPercent = 0;
  if (nextTier) {
      const range = nextTier.limit - currentTier.limit;
      const progress = totalSpent - currentTier.limit;
      progressPercent = Math.min(100, Math.max(0, (progress / range) * 100));
  }

  // Загрузка активного заказа (при старте и при изменении юзера)
  useEffect(() => {
    loadLastOrder();
  }, [user]);

  const loadLastOrder = async () => {
    setLoadingOrder(true);
    try {
        // Используем ID юзера или тестовый, если в браузере
        const tgId = user?.id || 1332986231;
        
        const res = await fetch(`https://proshein.com/webhook/get-orders?tg_id=${tgId}`);
        
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        
        const text = await res.text();

        if (text) {
            const json = JSON.parse(text);
            
            // Универсальный поиск массива
            let list = [];
            if (Array.isArray(json)) list = json;
            else if (json.items && Array.isArray(json.items)) list = json.items;
            else if (json.orders && Array.isArray(json.orders)) list = json.orders;

            if (list.length > 0) {
                setActiveOrder(list[0]); // Берем самый первый (свежий) заказ
            }
        }
    } catch (e) {
        console.error("Home: Ошибка загрузки:", e);
    } finally {
        setLoadingOrder(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setLink(text);
      else window.Telegram?.WebApp?.showAlert('Буфер пуст');
    } catch (e) { window.Telegram?.WebApp?.showAlert('Не удалось вставить'); }
  };

  // --- ИНТЕГРАЦИЯ ВЕБХУКА ПАРСИНГА ---
  const handleProcessLink = async () => {
    if (!link) {
       window.Telegram?.WebApp?.showAlert("Сначала вставьте ссылку!");
       return;
    }

    // 1. Показываем лоадер в Telegram
    const mainBtn = window.Telegram?.WebApp?.MainButton;
    mainBtn?.setText("⏳ Ищем товар...");
    mainBtn?.show();
    mainBtn?.showProgress();

    try {
        // 2. Отправляем запрос на твой n8n вебхук
        const tgId = user?.id || 1332986231;

        const res = await fetch('https://proshein.com/webhook/parse-shein', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                link: link,
                tg_id: tgId
            })
        });

        const json = await res.json();

        // 3. Проверяем ответ
        // Твой вебхук возвращает { status: "success", ... } в конце успешной цепочки
        if (json.status === 'success' || (json.items && json.items.length > 0) || json.count > 0) {
            window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
            setLink(''); // Очищаем поле
            
            // Переходим в корзину, чтобы показать результат
            if (setActiveTab) setActiveTab('cart');
        } else {
            throw new Error(json.message || 'Не удалось найти товар');
        }

    } catch (e) {
        console.error(e);
        window.Telegram?.WebApp?.showAlert("Ошибка: " + (e.message || "Неверная ссылка"));
        window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('error');
    } finally {
        // 4. Скрываем лоадер
        mainBtn?.hideProgress();
        mainBtn?.hide();
    }
  };

  const copyId = (e) => {
     e.stopPropagation();
     if (user?.id) {
         navigator.clipboard.writeText(user.id.toString());
         window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
     }
  };

  return (
    <div className="flex flex-col h-full pb-24 animate-fade-in">
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 pt-8 pb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* ИСПОЛЬЗУЕМ РЕАЛЬНОЕ ФОТО ИЛИ ЗАГЛУШКУ */}
            <div 
              className="bg-center bg-no-repeat bg-cover rounded-full w-12 h-12 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-900/50" 
              style={{ backgroundImage: user?.photo_url ? `url('${user.photo_url}')` : 'none', backgroundColor: '#102216' }}
            >
                {!user?.photo_url && (
                    <span className="material-symbols-outlined text-white/50 flex items-center justify-center w-full h-full text-xl">person</span>
                )}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-[#101622] rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-primary/80 text-xs font-medium tracking-widest uppercase">Добро пожаловать</span>
            <h2 className="text-white text-xl font-light leading-tight tracking-wide">{user?.first_name || 'Гость'}</h2>
          </div>
        </div>
        <button 
          onClick={() => window.Telegram?.WebApp?.showAlert("Уведомлений пока нет")}
          className="flex w-10 h-10 items-center justify-center rounded-full glass text-white hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>

      {/* 3D FLIP LOYALTY CARD */}
      <div className="px-6 py-4 relative z-10 perspective-1000 group">
        <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`relative w-full aspect-[1.8/1] transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
        >
            {/* FRONT (Лицевая) */}
            <div className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/40 bg-gradient-to-br ${currentTier.bgFrom} via-[#042f2e] to-[#020617]`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay z-0"></div>
                
                <div className="relative z-10 flex flex-col justify-between h-full p-6">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="text-white/60 text-xs font-medium tracking-widest uppercase mb-1">Баланс</span>
                            <span className="text-white text-3xl font-bold tracking-tight">
                                {displayPoints} <span className="text-lg font-light text-primary">WIBE</span>
                            </span>
                        </div>
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                            <span className="material-symbols-outlined text-white/90">qr_code_2</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                            <span className="text-white/40 text-[10px] uppercase tracking-wider">ID Клиента</span>
                            <div className="flex items-center gap-2">
                                <span className="text-white/90 font-mono text-sm tracking-widest">{user?.id || '...'}</span>
                                <button onClick={copyId} className="text-primary hover:text-white transition-colors p-1">
                                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                </button>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`${currentTier.color} text-xs font-bold tracking-widest uppercase`}>{dbUser?.status || 'Bronze'}</p>
                            <p className="text-white/50 text-[10px] uppercase mt-0.5">Нажми, чтобы перевернуть</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* BACK (Обратная) */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl overflow-hidden shadow-2xl shadow-black bg-[#0f172a] border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] to-[#0f172a] z-0"></div>
                
                <div className="relative z-10 flex flex-col h-full p-5">
                    <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">military_tech</span>
                        Ваш уровень: <span className={currentTier.color}>{currentTier.name}</span>
                    </h3>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="flex justify-between text-[10px] text-white/60 mb-1">
                            <span>Потрачено: {totalSpent.toLocaleString()} ₽</span>
                            {nextTier && <span>Цель: {nextTier.limit.toLocaleString()} ₽</span>}
                            {!nextTier && <span>Максимум!</span>}
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-1000" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Tiers List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
                        {TIERS.map((tier) => (
                            <div key={tier.id} className={`flex items-start gap-2 p-2 rounded-lg ${tier.id === currentTier.id ? 'bg-white/10 border border-white/5' : 'opacity-50'}`}>
                                <div className={`w-2 h-2 rounded-full mt-1.5 ${tier.id === currentTier.id ? 'bg-primary animate-pulse' : 'bg-white/20'}`}></div>
                                <div>
                                    <p className={`text-xs font-bold ${tier.color} uppercase`}>{tier.name}</p>
                                    <p className="text-[10px] text-white/60">{tier.benefits.join(', ')}</p>
                                    {tier.limit > 0 && <p className="text-[9px] text-white/30 mt-0.5">от {tier.limit.toLocaleString()} ₽</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* How to order */}
      <div className="px-6 mb-2 relative z-10">
        <div className="bg-dark-card/50 border border-white/5 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">play_circle</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Как оформить заказ?</p>
            <p className="text-xs text-white/50">Видео-инструкция за 1 минуту</p>
          </div>
          <span className="material-symbols-outlined text-white/30 ml-auto">chevron_right</span>
        </div>
      </div>

      {/* Link Input */}
      <div className="px-6 py-2 relative z-10">
        <div className="flex flex-col gap-4">
          <label className="group flex flex-col gap-2">
            <span className="text-white/60 text-sm font-medium ml-1">Добавить товар</span>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-primary flex items-center pointer-events-none">
                <span className="material-symbols-outlined">link</span>
              </div>
              <input 
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="custom-input w-full h-14 pl-12 pr-12 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-light" 
                placeholder="Вставьте ссылку" 
                type="text"
              />
              <button onClick={handlePaste} className="absolute right-2 p-2 bg-white/5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>content_paste</span>
              </button>
            </div>
          </label>
          <button onClick={handleProcessLink} className="w-full h-14 bg-gradient-to-r from-primary to-emerald-600 rounded-xl flex items-center justify-center gap-2 text-[#101622] font-bold text-base shadow-[0_0_20px_rgba(19,236,91,0.3)] hover:shadow-[0_0_30px_rgba(19,236,91,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
            <span className="material-symbols-outlined">calculate</span>
            Рассчитать стоимость
          </button>
        </div>
      </div>

      {/* Active Orders */}
      <div className="px-6 pt-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-light tracking-wide">Активные заказы</h3>
          <button 
            onClick={() => setActiveTab && setActiveTab('profile')} 
            className="text-primary text-sm font-medium hover:text-emerald-300 transition-colors"
          >
            Все
          </button>
        </div>
        
        <div className="flex flex-col gap-3 pb-8">
            {loadingOrder ? (
                 <div className="animate-pulse h-20 bg-white/5 rounded-2xl border border-white/5"></div>
            ) : activeOrder ? (
                 <div onClick={() => setActiveTab && setActiveTab('profile')} className="group flex items-center gap-4 p-3 rounded-2xl bg-[#1c2636]/60 border border-white/5 hover:bg-[#1c2636] transition-all duration-300 active:scale-95 cursor-pointer">
                    <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-white/5">
                        {activeOrder.order_items?.[0]?.image_url 
                           ? <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url('${activeOrder.order_items[0].image_url}')`}}></div>
                           : <span className="material-symbols-outlined text-white/20 m-auto flex h-full items-center justify-center">local_mall</span>
                        }
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                        <div className="flex justify-between items-start">
                            <h4 className="text-white font-medium text-sm line-clamp-1 pr-2">Заказ #{activeOrder.id.substring(0,8).toUpperCase()}</h4>
                            <span className="text-white font-bold text-sm whitespace-nowrap">{activeOrder.total_amount.toLocaleString()} ₽</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-white/40 text-xs">{new Date(activeOrder.created_at).toLocaleDateString('ru-RU')}</p>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                                <span className={`size-1.5 rounded-full ${activeOrder.status === 'paid' ? 'bg-primary' : 'bg-gray-500'} animate-pulse`}></span>
                                <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">{activeOrder.status === 'paid' ? 'Оплачен' : activeOrder.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 text-center text-white/30 text-xs border border-dashed border-white/10 rounded-xl">
                    Нет активных заказов
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
