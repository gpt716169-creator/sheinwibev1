import React from 'react';

export default function ActiveOrders({ orders, onGoToOrders }) {
  // Фильтруем только активные (не доставленные и не отмененные)
  // Добавил 'completed', чтобы завершенные заказы уходили из "Активных"
  const activeOrders = orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status));

  if (activeOrders.length === 0) return null;

  // Берем самый свежий
  const latestOrder = activeOrders[0];

  // --- ЛОГИКА ОПРЕДЕЛЕНИЯ СТАТУСА (Как в OrdersTab) ---
  const getSmartStatus = (order) => {
    // 1. Если есть реальные треки
    if (order.tracking_history && Array.isArray(order.tracking_history) && order.tracking_history.length > 0) {
       const sorted = [...order.tracking_history].sort((a, b) => new Date(b.date) - new Date(a.date));
       return { text: sorted[0].status, color: 'text-primary bg-primary/10 border-primary/20' };
    }

    // 2. Виртуальный трекинг по времени
    if (!order.created_at) return { text: 'В обработке', color: 'text-white/50 bg-white/5 border-white/10' };

    const diffMinutes = (new Date() - new Date(order.created_at)) / (1000 * 60);

    if (diffMinutes >= 8 * 24 * 60) return { text: 'Таможня', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' };
    if (diffMinutes >= 7 * 24 * 60) return { text: 'На складе РФ', color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20' };
    if (diffMinutes >= 3 * 24 * 60) return { text: 'В пути в РФ', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' };
    if (diffMinutes >= 2 * 24 * 60) return { text: 'Отправлен SHEIN', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' };
    if (diffMinutes >= 1 * 24 * 60) return { text: 'Сборка', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' };
    if (diffMinutes >= 15) return { text: 'Выкуплен', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };

    return { text: 'Оформлен', color: 'text-white/70 bg-white/10 border-white/20' };
  };

  const status = getSmartStatus(latestOrder);

  return (
    <div className="mt-6 animate-fade-in">
        <div className="flex justify-between items-end mb-2 px-1">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Активные заказы ({activeOrders.length})</h3>
            <button onClick={onGoToOrders} className="text-primary text-xs font-bold">Все заказы</button>
        </div>

        <div 
            onClick={onGoToOrders}
            className="bg-gradient-to-br from-[#1c2636] to-[#151c28] border border-white/10 p-4 rounded-2xl shadow-xl cursor-pointer active:scale-[0.99] transition-transform relative overflow-hidden group"
        >
            {/* Декоративный фон */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10"></div>

            <div className="flex gap-4 items-center relative z-10">
                {/* Миниатюры товаров (до 3 штук) */}
                <div className="flex -space-x-3">
                    {(latestOrder.order_items || []).slice(0, 3).map((item, idx) => (
                        <div 
                            key={idx} 
                            className="w-12 h-12 rounded-full border-2 border-[#1c2636] bg-cover bg-center bg-white/5" 
                            style={{backgroundImage: `url('${item.image_url}')`}}
                        ></div>
                    ))}
                    {(latestOrder.order_items?.length > 3) && (
                        <div className="w-12 h-12 rounded-full border-2 border-[#1c2636] bg-[#2a3441] flex items-center justify-center text-[10px] text-white font-bold">
                            +{latestOrder.order_items.length - 3}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className="text-white font-bold text-sm truncate">Заказ #{latestOrder.id.slice(0,6).toUpperCase()}</h4>
                        {/* ДИНАМИЧЕСКИЙ СТАТУС */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${status.color}`}>
                            {status.text}
                        </span>
                    </div>
                    <p className="text-white/40 text-xs mt-1 truncate">
                        {latestOrder.tracking_number ? `Трек: ${latestOrder.tracking_number}` : 'Ожидает отправки'}
                    </p>
                </div>
                
                <span className="material-symbols-outlined text-white/20 group-hover:text-white/60 transition-colors">chevron_right</span>
            </div>
        </div>
    </div>
  );
}
