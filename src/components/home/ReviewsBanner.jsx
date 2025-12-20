import React from 'react';

export default function ReviewsBanner() {
  const handleOpenChannel = () => {
    const link = 'https://t.me/reviewsheinwibe';
    // Используем нативный метод Telegram, чтобы канал открылся мгновенно внутри приложения
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(link);
    } else {
      window.open(link, '_blank');
    }
  };

  return (
    <div 
      onClick={handleOpenChannel}
      className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors active:scale-[0.98]"
    >
      {/* Иконка */}
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
        <span className="material-symbols-outlined">photo_camera</span>
      </div>

      {/* Текст */}
      <div className="flex-1">
        <h4 className="text-white font-bold text-sm">Живые отзывы</h4>
        <p className="text-white/40 text-xs">Смотри фото реальных заказов</p>
      </div>

      {/* Стрелочка */}
      <span className="material-symbols-outlined text-white/20">chevron_right</span>
    </div>
  );
}
