import React from 'react';

export default function OrdersTab({ orders, onSelectOrder }) {
  if (orders.length === 0) {
      return <div className="text-center text-white/30 text-sm py-10">Список заказов пуст</div>;
  }

  return (
    <div className="px-6 space-y-3 pb-10 animate-fade-in">
        {orders.map(order => (
            <div key={order.id} onClick={() => onSelectOrder(order)} className="bg-dark-card border border-white/5 rounded-xl p-4 cursor-pointer active:scale-95 transition-transform hover:bg-white/5">
                <div className="flex justify-between mb-2">
                    <span className="font-bold text-white text-sm">#{order.id.slice(0,8).toUpperCase()}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${order.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}>{order.status}</span>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex -space-x-2 pl-2">
                        {(order.order_items || []).slice(0,3).map((i,x) => (
                            <div key={x} className="w-8 h-8 rounded-full border border-[#151c28] bg-cover bg-center bg-white/5" style={{backgroundImage: `url('${i.image_url}')`}}></div>
                        ))}
                    </div>
                    <span className="font-bold text-primary">{order.total_amount?.toLocaleString()} ₽</span>
                </div>
            </div>
        ))}
    </div>
  );
}
