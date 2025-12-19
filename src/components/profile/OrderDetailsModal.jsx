import React from 'react';

export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  // Если истории пока нет, заглушка
  const trackingHistory = order.tracking_history && order.tracking_history.length > 0 
      ? order.tracking_history 
      : [
          { date: order.created_at, status: 'Заказ оформлен', location: 'В обработке' }
      ];

  const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-[#151c28] w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            
            {/* HEADER */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a2332] shrink-0">
                <div>
                    <h3 className="text-white font-bold">Заказ #{order.id.slice(0,6).toUpperCase()}</h3>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${order.status === 'paid' ? 'bg-emerald-500' : 'bg-yellow-500'}`}></span>
                        <p className="text-white/50 text-[10px] uppercase font-bold">{order.status}</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* 1. ТРЕКИНГ */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40">Статус доставки</h4>
                        <span className="text-primary font-mono text-xs select-all bg-primary/10 px-2 py-1 rounded">{order.tracking_number || 'Нет трека'}</span>
                    </div>

                    <div className="relative pl-2 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
                        {trackingHistory.map((event, index) => {
                            const isFirst = index === 0;
                            return (
                                <div key={index} className="relative pl-6">
                                    <div className={`absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full flex items-center justify-center border-4 border-[#1c232e] z-10 ${isFirst ? 'bg-primary shadow-[0_0_10px_rgba(19,236,91,0.4)]' : 'bg-white/20'}`}>
                                        {isFirst && <div className="w-2 h-2 bg-white rounded-full animate-ping absolute"></div>}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-bold leading-tight ${isFirst ? 'text-white' : 'text-white/50'}`}>{event.status}</span>
                                        {event.location && <span className="text-[10px] text-white/40 mt-0.5">{event.location}</span>}
                                        {event.date && <span className="text-[10px] text-primary/80 font-mono mt-1">{formatDate(event.date)}</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. ДАННЫЕ ДОСТАВКИ */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40 ml-1">Куда и кому</h4>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-white/30 text-lg mt-0.5">location_on</span>
                            <div>
                                <p className="text-white/40 text-[10px]">Адрес доставки</p>
                                <p className="text-white text-sm font-medium leading-snug">{order.delivery_address}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-white/30 text-lg">person</span>
                            <div>
                                <p className="text-white/40 text-[10px]">Получатель</p>
                                <p className="text-white text-sm font-medium">{order.recipient_name || order.user_info?.name}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. ТОВАРЫ (ИСПРАВЛЕННАЯ ЦЕНА) */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40 ml-1">Товары ({order.order_items?.length || 0})</h4>
                    <div className="space-y-2">
                        {order.order_items?.map((item, i) => {
                            // Ищем цену в разных полях, чтобы точно найти
                            const price = item.final_price_rub || item.price || 0;
                            
                            return (
                                <div key={i} className="flex gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                    {/* Картинка */}
                                    <div className="w-16 h-20 rounded-lg bg-cover bg-center bg-white/5 shrink-0 border border-white/5" style={{backgroundImage: `url('${item.image_url}')`}}></div>
                                    
                                    {/* Инфо */}
                                    <div className="flex flex-col justify-between flex-1 py-0.5 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            {/* Название (обрезаем если длинное) */}
                                            <p className="text-white text-xs font-medium line-clamp-2 leading-snug">{item.product_name}</p>
                                            
                                            {/* ЦЕНА (Не сжимается - shrink-0) */}
                                            <p className="text-primary font-bold text-sm shrink-0 whitespace-nowrap">
                                                {price.toLocaleString()} ₽
                                            </p>
                                        </div>
                                        
                                        <div className="flex justify-between items-end mt-2">
                                            <div className="flex gap-1 flex-wrap">
                                                <span className="text-[9px] bg-white/10 border border-white/10 px-1.5 py-0.5 rounded text-white/70">{item.size}</span>
                                                <span className="text-[9px] bg-white/10 border border-white/10 px-1.5 py-0.5 rounded text-white/70">{item.color}</span>
                                            </div>
                                            <p className="text-white/40 text-[10px] font-mono">x{item.quantity}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* 4. ИТОГО */}
                <div className="space-y-1 pt-3 border-t border-white/10">
                     <div className="flex justify-between items-center text-xs text-white/50">
                        <span>Сумма товаров</span>
                        <span>{((order.total_amount || 0) + (order.discount_amount || 0)).toLocaleString()} ₽</span>
                     </div>
                     {(order.discount_amount > 0) && (
                         <div className="flex justify-between items-center text-xs text-emerald-400">
                             <span>Скидка / Баллы</span>
                             <span>-{order.discount_amount} ₽</span>
                         </div>
                     )}
                     <div className="flex justify-between items-center pt-2 mt-2 border-t border-white/5">
                        <span className="text-white font-bold">Итого оплачено</span>
                        <span className="text-xl font-bold text-primary">{order.total_amount?.toLocaleString()} ₽</span>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
}
