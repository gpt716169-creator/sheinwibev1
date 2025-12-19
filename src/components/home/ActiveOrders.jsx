import React from 'react';

export default function ActiveOrders({ orders, onGoToOrders }) {
  // Фильтруем только активные (не доставленные и не отмененные)
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));

  if (activeOrders.length === 0) return null;

  // Берем самый свежий
  const latestOrder = activeOrders[0];

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
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-primary/20">
                            {latestOrder.status}
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
