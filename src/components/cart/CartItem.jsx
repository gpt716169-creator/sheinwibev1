import React from 'react';

export default function CartItem({ item, onEdit, onDelete, onUpdateQuantity }) {
  const isWarning = item.size === 'NOT_SELECTED' || !item.size;

  return (
    <div 
        onClick={() => onEdit(item)}
        className={`relative group p-3 rounded-2xl bg-dark-card/80 border backdrop-blur-sm flex gap-3 cursor-pointer transition-all active:scale-[0.99] ${isWarning ? 'border-red-500/30 bg-red-900/5' : 'border-white/5'}`}
    >
        {/* Кнопка удаления */}
        <button 
            className="absolute top-3 right-3 text-white/20 hover:text-red-400 p-2 z-10" 
            onClick={(e) => onDelete(e, item.id)}
        >
            <span className="material-symbols-outlined text-sm">close</span>
        </button>

        {/* Картинка */}
        <div className="w-20 h-24 rounded-lg bg-cover bg-center shrink-0 bg-white/5" style={{backgroundImage: `url('${item.image_url}')`}}></div>

        {/* Инфо */}
        <div className="flex flex-col justify-between flex-1 py-1 pr-6">
            <h3 className="text-white text-xs leading-tight line-clamp-2 font-medium">{item.product_name}</h3>
            
            {/* Блок характеристик (Размер / Цвет) */}
            {isWarning ? (
                <div className="mt-2 flex items-center gap-1 text-red-400 text-[10px] font-bold uppercase animate-pulse">
                    <span className="material-symbols-outlined text-xs">warning</span>
                    Выберите параметры
                </div>
            ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                    {/* Размер */}
                    <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-white/70 font-mono">
                        {item.size}
                    </span>
                    {/* Цвет (если есть) */}
                    {item.color && (
                        <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-white/70 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full border border-white/20" style={{backgroundColor: item.color.toLowerCase() === 'white' ? '#fff' : item.color}}></span>
                            {item.color}
                        </span>
                    )}
                </div>
            )}

            {/* Цена и Кол-во */}
            <div className="flex justify-between items-end mt-2">
                <span className="text-primary font-bold text-base">{(item.final_price_rub * item.quantity).toLocaleString()} ₽</span>
                
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1 border border-white/5" onClick={e => e.stopPropagation()}>
                    <button className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white" onClick={() => onUpdateQuantity(item.id, -1)}>-</button>
                    <span className="text-xs w-4 text-center text-white font-medium">{item.quantity}</span>
                    <button className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white" onClick={() => onUpdateQuantity(item.id, 1)}>+</button>
                </div>
            </div>
        </div>
    </div>
  );
}
