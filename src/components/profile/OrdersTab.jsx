import React from 'react';

export default function OrdersTab({ orders = [], onSelectOrder }) {

  const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const getOrderStatus = (order) => {
    // 1. ФИНАЛЬНЫЕ СТАТУСЫ
    if (order.status === 'cancelled') return { text: 'Отменен', color: 'text-red-500 bg-red-500/10' };
    if (order.status === 'completed') return { text: 'Доставлен', color: 'text-green-500 bg-green-500/10' };
    
    // 2. ОЖИДАНИЕ ОПЛАТЫ
    if (order.status === 'waiting_for_pay') {
        return { text: 'Ожидает оплаты', color: 'text-orange-400 bg-orange-400/10 border border-orange-400/20' };
    }

    // 3. СТАТУСЫ ИЗ ТРЕКИНГА
    if (order.tracking_history && Array.isArray(order.tracking_history) && order.tracking_history.length > 0) {
       const sorted = [...order.tracking_history].sort((a, b) => new Date(b.date) - new Date(a.date));
       return { text: sorted[0].status, color: 'text-primary bg-primary/10' };
    }

    // 4. ВИРТУАЛЬНЫЕ СТАТУСЫ
    if (!order.created_at) return { text: 'В обработке', color: 'text-white/50 bg-white/5' };
    const diffMinutes = (new Date() - new Date(order.created_at)) / (1000 * 60);

    if (diffMinutes >= 8 * 24 * 60) return { text: 'Таможня', color: 'text-blue-400 bg-blue-400/10' };
    if (diffMinutes >= 7 * 24 * 60) return { text: 'На складе SW', color: 'text-indigo-400 bg-indigo-400/10' };
    if (diffMinutes >= 3 * 24 * 60) return { text: 'В пути', color: 'text-purple-400 bg-purple-400/10' };
    if (diffMinutes >= 2 * 24 * 60) return { text: 'Отправлен SHEIN', color: 'text-purple-400 bg-purple-400/10' };
    if (diffMinutes >= 1 * 24 * 60) return { text: 'Сборка', color: 'text-yellow-400 bg-yellow-400/10' };
    if (diffMinutes >= 15) return { text: 'Выкуплен', color: 'text-emerald-400 bg-emerald-400/10' };

    return { text: 'Оформлен', color: 'text-white/70 bg-white/10' };
  };

  // ЕСЛИ ПУСТО
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/30">
        <span className="material-symbols-outlined text-4xl mb-2">shopping_bag</span>
        <p>История заказов пуста</p>
      </div>
    );
  }

  // РЕНДЕР СПИСКА
  return (
    <div className="space-y-3 pb-24">
      {orders.map((order) => {
        const status = getOrderStatus(order);
        
        // Форматирование номера: SHEIN B-124 или #F47AC...
        const displayId = order.order_number 
            ? `SHEIN B-${order.order_number}` 
            : `#${order.id.slice(0, 8).toUpperCase()}`;

        return (
            <div 
              key={order.id} 
              onClick={() => onSelectOrder(order)} 
              className="bg-[#151c28] border border-white/5 rounded-2xl p-4 active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">{displayId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${status.color}`}>
                        {status.text}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">{formatDate(order.created_at)}</p>
                </div>
                <span className="text-white font-bold">{Math.floor(order.total_amount).toLocaleString()} ₽</span>
              </div>

              <div className="flex gap-2 overflow-hidden">
                {(order.order_items || []).slice(0, 4).map((item, idx) => (
                   <div key={idx} className="w-12 h-14 bg-[#1a2333] rounded-lg bg-cover bg-center border border-white/5 shrink-0 relative" style={{backgroundImage: `url('${item.image_url}')`}}>
                      {item.quantity > 1 && (
                          <div className="absolute bottom-0 right-0 bg-black/60 text-[8px] text-white px-1 rounded-tl">x{item.quantity}</div>
                      )}
                   </div>
                ))}
                {(order.order_items || []).length > 4 && (
                   <div className="w-12 h-14 bg-[#1a2333] rounded-lg border border-white/5 flex items-center justify-center text-white/30 text-xs font-bold shrink-0">
                      +{order.order_items.length - 4}
                   </div>
                )}
              </div>
            </div>
        );
      })}
    </div>
  );
}
