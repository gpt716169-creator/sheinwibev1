import React from 'react';

export default function CartItem({ 
  item, 
  isSelected, 
  onToggleSelect, 
  onEdit, 
  onDelete, 
  onUpdateQuantity 
}) {
  // Проверка наличия
  const inStock = item.is_in_stock !== false;
  // Ворнинг, если не выбран размер (только для товаров в наличии)
  const isWarning = (item.size === 'NOT_SELECTED' || !item.size) && inStock;

  return (
    <div className={`relative group p-2.5 rounded-2xl border backdrop-blur-sm flex gap-3 transition-all overflow-hidden 
      ${!inStock ? 'bg-black/40 border-white/5 opacity-60 grayscale-[0.5]' : 
        isWarning ? 'border-red-500/30 bg-red-900/10' : 'bg-[#1c2636] border-white/5'}`}
    >
        
        {/* === 1. ЧЕКБОКС (Выровнен по центру) === */}
        <div className="flex items-center shrink-0">
             <button 
                onClick={() => inStock && onToggleSelect(item.id)}
                disabled={!inStock}
                className={`p-1 -ml-1 transition-transform ${!inStock ? 'cursor-not-allowed opacity-30' : 'active:scale-90'}`}
             >
                <span className={`material-symbols-outlined text-[26px] ${isSelected && inStock ? 'text-primary' : 'text-white/20'}`}>
                    {isSelected && inStock ? 'check_box' : 'check_box_outline_blank'}
                </span>
             </button>
        </div>

        {/* === 2. КАРТИНКА === */}
        {/* Чуть уменьшил ширину (w-18), чтобы дать место тексту */}
        <div 
            onClick={() => inStock && onEdit(item)}
            className="w-18 h-22 rounded-lg bg-cover bg-center shrink-0 bg-white/5 cursor-pointer border border-white/5 relative overflow-hidden" 
            style={{
                backgroundImage: `url('${item.image_url}')`,
                width: '4.5rem', // 72px (было 80px)
                height: '6rem'   // 96px
            }}
        >
             {/* Оверлей "Нет в наличии" */}
             {!inStock && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                     <span className="material-symbols-outlined text-white/50 text-2xl">block</span>
                 </div>
             )}
        </div>

        {/* === 3. КОНТЕНТ === */}
        <div className="flex flex-col justify-between flex-1 py-0.5 min-w-0">
            
            {/* Верх: Имя и Кнопка удаления */}
            <div className="flex justify-between items-start gap-2">
                 <h3 
                    onClick={() => inStock && onEdit(item)}
                    className={`text-white text-xs leading-snug font-medium line-clamp-2 pr-6 ${!inStock && 'line-through text-white/50'}`}
                 >
                    {item.product_name}
                 </h3>
                 
                 {/* Кнопка удаления (Absolute, чтобы не ломать верстку) */}
                 <button 
                    className="absolute top-2 right-2 text-white/20 hover:text-red-400 p-1 z-10 active:scale-90 transition-transform" 
                    onClick={(e) => onDelete(e, item.id)}
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>
            
            {/* Середина: Параметры (Размер/Цвет) */}
            <div onClick={() => inStock && onEdit(item)} className={`mt-1.5 ${inStock ? 'cursor-pointer group/edit' : ''}`}>
                {!inStock ? (
                     <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white/40">
                        Нет в наличии
                     </span>
                ) : isWarning ? (
                    <div className="flex items-center gap-1 text-red-400 text-[10px] font-bold uppercase animate-pulse">
                        <span className="material-symbols-outlined text-xs">warning</span>
                        Выбрать размер
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {/* Размер */}
                        <div className="flex items-center gap-1 bg-black/20 border border-white/10 px-1.5 py-0.5 rounded text-[10px] text-white/80 group-hover/edit:border-primary/50 transition-colors">
                            <span className="font-mono font-bold">{item.size}</span>
                            <span className="material-symbols-outlined text-[10px] opacity-50">expand_more</span>
                        </div>
                        {/* Цвет */}
                        {item.color && (
                            <div className="flex items-center gap-1 bg-black/20 border border-white/10 px-1.5 py-0.5 rounded text-[10px] text-white/60">
                                <span className="w-2 h-2 rounded-full border border-white/20" style={{backgroundColor: item.color.toLowerCase() === 'white' ? '#fff' : item.color}}></span>
                                <span className="max-w-[50px] truncate">{item.color}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Низ: Цена и Количество */}
            {inStock && (
                <div className="flex justify-between items-end mt-2">
                    {/* Цена: Убрал truncate, теперь она перенесется или расширится */}
                    <span className="text-primary font-bold text-sm whitespace-nowrap mr-2">
                        {(item.final_price_rub * item.quantity).toLocaleString()} ₽
                    </span>
                    
                    {/* Кнопки +/- */}
                    <div className="flex items-center gap-1 bg-[#151c28] rounded-lg p-0.5 border border-white/10 shrink-0 shadow-sm">
                        <button 
                            className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white active:bg-white/10 rounded-md transition-colors" 
                            onClick={() => onUpdateQuantity(item.id, -1)}
                        >
                            −
                        </button>
                        <span className="text-xs w-4 text-center text-white font-bold select-none">{item.quantity}</span>
                        <button 
                            className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white active:bg-white/10 rounded-md transition-colors" 
                            onClick={() => onUpdateQuantity(item.id, 1)}
                        >
                            +
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
