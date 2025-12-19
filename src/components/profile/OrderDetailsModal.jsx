import React, { useMemo } from 'react';

export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  // --- ЛОГИКА СТАТУСОВ ---
  const statusInfo = useMemo(() => {
      switch (order.status?.toLowerCase()) {
          case 'paid':
              return { label: 'Оплачено', percent: 30, icon: 'credit_score', color: 'text-emerald-400', desc: 'Заказ принят в работу' };
          case 'processing':
              return { label: 'В сборке', percent: 50, icon: 'inventory_2', color: 'text-blue-400', desc: 'Собираем товары на складе' };
          case 'shipped':
              return { label: 'В пути', percent: 75, icon: 'local_shipping', color: 'text-primary', desc: 'Заказ передан в доставку' };
          case 'delivered':
              return { label: 'Доставлено', percent: 100, icon: 'check_circle', color: 'text-primary', desc: 'Заказ ожидает вас' };
          case 'cancelled':
              return { label: 'Отменен', percent: 100, icon: 'cancel', color: 'text-red-500', desc: 'Заказ был отменен' };
          default: // created, pending
              return { label: 'Создан', percent: 10, icon: 'pending', color: 'text-white/60', desc: 'Ожидает оплаты' };
      }
  }, [order.status]);

  // Копирование трек-номера
  const handleCopyTrack = () => {
      if (order.tracking_number) {
          navigator.clipboard.writeText(order.tracking_number);
          window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
          window.Telegram?.WebApp?.showAlert('Трек-номер скопирован!');
      } else {
          window.Telegram?.WebApp?.showAlert('Трек-номер еще не присвоен');
      }
  };

  // Расчет даты доставки (фейковый для примера, потом можно брать из базы)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 14);
  const dateStr = deliveryDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  return (
    // ПОЛНОЭКРАННЫЙ МОДАЛ
    <div className="fixed inset-0 z-[100] bg-[#102217] flex flex-col animate-slide-up overflow-hidden font-sans text-white">
        
        {/* --- HEADER --- */}
        <div className="fixed top-0 z-50 w-full bg-[#102217]/90 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center justify-between p-4 pt-6 pb-3">
                <button 
                    onClick={onClose}
                    className="flex w-10 h-10 items-center justify-center rounded-full text-white hover:bg-white/10 active:bg-white/20 transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </button>
                <h2 className="text-lg font-bold leading-tight tracking-wide text-white flex-1 text-center pr-10">
                    Заказ #{order.id.slice(0, 8).toUpperCase()}
                </h2>
            </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 overflow-y-auto mt-[76px] pb-32 p-4 space-y-6">
            
            {/* 1. STATUS TRACKER CARD */}
            <div className="relative overflow-hidden rounded-2xl bg-[#162e21] p-5 shadow-lg border border-white/5">
                {/* Glow Background */}
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#0df26c]/10 blur-3xl"></div>
                
                <div className="mb-4 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                        {order.status !== 'cancelled' && (
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0df26c] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0df26c]"></span>
                            </span>
                        )}
                        <p className="text-white text-base font-bold tracking-wide shadow-black drop-shadow-sm">{statusInfo.label}</p>
                    </div>
                    <span className={`material-symbols-outlined ${statusInfo.color} drop-shadow-[0_0_5px_rgba(13,242,108,0.5)]`}>{statusInfo.icon}</span>
                </div>

                {/* Progress Bar */}
                <div className="relative mb-3 h-2 w-full rounded-full bg-black/40">
                    <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${order.status === 'cancelled' ? 'bg-red-500' : 'bg-[#0df26c] shadow-[0_0_12px_rgba(13,242,108,0.6)]'}`} 
                        style={{ width: `${statusInfo.percent}%` }}
                    ></div>
                </div>

                <div className="flex justify-between items-end relative z-10">
                    <p className="text-[#90cba9] text-xs font-normal">{statusInfo.desc}</p>
                    {order.status !== 'cancelled' && (
                        <p className="text-[#90cba9] text-xs font-normal text-right">
                            Доставка: <span className="text-white font-bold">~{dateStr}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* 2. ITEMS LIST */}
            <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#90cba9] ml-1 opacity-60">Товары</h3>
                
                {order.order_items?.map((item, i) => (
                    <div key={i} className="group flex gap-4 rounded-2xl bg-[#162e21] p-3 shadow-sm border border-white/5 transition-colors hover:bg-white/5">
                        <div 
                            className="bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-lg w-[70px] shrink-0 border border-white/10 shadow-inner" 
                            style={{ backgroundImage: `url('${item.image_url}')` }}
                        ></div>
                        <div className="flex flex-1 flex-col justify-center gap-1">
                            <div className="flex justify-between items-start">
                                <p className="text-white text-sm font-medium leading-tight line-clamp-2">{item.product_name}</p>
                            </div>
                            <p className="text-[#90cba9] text-xs font-normal">{item.size} • {item.color}</p>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-white text-sm font-bold">{item.final_price_rub.toLocaleString()} ₽</p>
                                <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-[#90cba9] border border-white/5">x1</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. DETAILS GRID */}
            <div className="grid grid-cols-1 gap-4">
                {/* Shipping Address */}
                <div className="rounded-2xl bg-[#162e21] p-4 border border-white/5 flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#102217] text-[#0df26c] shadow-sm border border-white/5">
                        <span className="material-symbols-outlined text-[20px]">location_on</span>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#90cba9] mb-1">Куда</p>
                        <p className="text-white text-sm leading-relaxed font-medium">{order.delivery_address || 'Адрес не указан'}</p>
                    </div>
                </div>

                {/* Tracking Number (если есть) */}
                {order.tracking_number && (
                    <div onClick={handleCopyTrack} className="rounded-2xl bg-[#162e21] p-4 border border-white/5 flex items-start gap-4 active:bg-white/5 cursor-pointer">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#102217] text-[#0df26c] shadow-sm border border-white/5">
                            <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                        </div>
                        <div className="flex flex-col w-full">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#90cba9] mb-1">Трек-номер</p>
                            <div className="flex items-center justify-between w-full">
                                <span className="text-white text-sm font-mono font-medium">{order.tracking_number}</span>
                                <span className="material-symbols-outlined text-[#90cba9] text-sm">content_copy</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. FINANCIAL BREAKDOWN */}
            <div className="rounded-2xl bg-[#162e21] p-5 border border-white/5">
                <div className="flex justify-between py-2 border-b border-white/5">
                    <p className="text-[#90cba9] text-sm">Сумма товаров</p>
                    <p className="text-white text-sm font-medium">{order.total_amount?.toLocaleString()} ₽</p>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                    <p className="text-[#90cba9] text-sm">Доставка</p>
                    <p className="text-[#0df26c] text-sm font-medium">Бесплатно</p>
                </div>
                <div className="flex justify-between items-end pt-5 pb-1">
                    <p className="text-white text-base font-semibold">Итого</p>
                    <p className="text-[#0df26c] text-2xl font-bold tracking-tight drop-shadow-[0_0_15px_rgba(13,242,108,0.4)]">
                        {order.total_amount?.toLocaleString()} ₽
                    </p>
                </div>
            </div>

        </div>

        {/* --- FOOTER CTA --- */}
        <div className="fixed bottom-0 left-0 w-full bg-[#102217]/90 backdrop-blur-xl border-t border-white/10 p-4 pb-8 z-40">
            <button 
                onClick={handleCopyTrack}
                disabled={!order.tracking_number}
                className={`group relative w-full overflow-hidden rounded-xl py-3.5 font-bold text-base shadow-[0_0_20px_rgba(13,242,108,0.2)] transition-all active:scale-[0.99] ${!order.tracking_number ? 'bg-white/10 text-white/30' : 'bg-[#0df26c] text-[#102217] hover:shadow-[0_0_30px_rgba(13,242,108,0.4)]'}`}
            >
                <div className="relative z-10 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">
                        {order.tracking_number ? 'location_searching' : 'timelapse'}
                    </span>
                    {order.tracking_number ? 'Отследить заказ' : 'Ждем трек-номер'}
                </div>
                
                {/* Button Glow Effect */}
                {order.tracking_number && (
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0df26c] via-[#4af591] to-[#0df26c] opacity-100"></div>
                )}
            </button>
        </div>

    </div>
  );
}
