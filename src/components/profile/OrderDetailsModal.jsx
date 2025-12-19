import React from 'react';

export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-[#151c28] w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a2332]">
                <h3 className="text-white font-bold">Заказ #{order.id.slice(0,6).toUpperCase()}</h3>
                <button onClick={onClose} className="text-white/50 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                {/* Статус блок */}
                <div className="bg-white/5 rounded-xl p-3 space-y-2">
                     <div className="flex justify-between text-xs"><span className="text-white/50">Статус</span><span className="text-white font-bold">{order.status}</span></div>
                     <div className="flex justify-between text-xs"><span className="text-white/50">Трек-номер</span><span className="text-primary font-mono select-all">{order.tracking_number || 'В обработке'}</span></div>
                     <div className="flex justify-between text-xs"><span className="text-white/50">Доставка</span><span className="text-white text-right max-w-[150px] leading-tight">{order.delivery_address}</span></div>
                </div>

                {/* Товары */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase text-white/40">Товары</h4>
                    {order.order_items?.map((item, i) => (
                        <div key={i} className="flex gap-3 bg-white/5 p-2 rounded-lg">
                            <div className="w-12 h-16 rounded bg-cover bg-center bg-white/5 shrink-0" style={{backgroundImage: `url('${item.image_url}')`}}></div>
                            <div className="flex flex-col justify-center">
                                <p className="text-white text-xs line-clamp-2 leading-snug">{item.product_name}</p>
                                <p className="text-white/50 text-[10px] mt-1">{item.size} / {item.color}</p>
                                <p className="text-primary font-bold text-xs mt-1">{item.final_price_rub} ₽</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Итого */}
                <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="text-white/50 text-sm">Итого:</span>
                    <span className="text-xl font-bold text-white">{order.total_amount?.toLocaleString()} ₽</span>
                </div>
            </div>
        </div>
    </div>
  );
}
