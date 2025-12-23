import React from 'react';

export default function CartItem({ 
  item, 
  isSelected,       // Новый проп: выбран ли товар
  onToggleSelect,   // Новый проп: функция переключения выбора
  onEdit, 
  onDelete, 
  onUpdateQuantity 
}) {
  // Проверка наличия (по умолчанию true, если поля нет в базе)
  const inStock = item.is_in_stock !== false;

  // Если нет в наличии, считаем это тоже "ворнингом" для стилей, но блокируем выбор
  const isWarning = (item.size === 'NOT_SELECTED' || !item.size) && inStock;

  return (
    <div className={`relative group p-3 rounded-2xl border backdrop-blur-sm flex gap-3 transition-all overflow-hidden 
      ${!inStock ? 'bg-black/40 border-white/5 opacity-60 grayscale-[0.5]' : 
        isWarning ? 'border-red-500/30 bg-red-900/10' : 'bg-[#1c2636] border-white/5'}`}
    >
        
        {/* === ЧЕКБОКС (ВЫБОР) === */}
        <div className="flex items-center justify-center pr-1 border-r border-white/5 mr-1">
             <button 
                onClick={() => inStock && onToggleSelect(item.id)}
                disabled={!inStock}
                className={`transition-colors ${!inStock ? 'cursor-not-allowed opacity-30' : 'active:scale-90'}`}
             >
                <span className={`material-symbols-outlined text-2xl ${isSelected && inStock ? 'text-primary' : 'text-white/20'}`}>
                    {isSelected && inStock ? 'check_box' : 'check_box_outline_blank'}
                </span>
             </button>
        </div>

        {/* Кнопка удаления */}
        <button 
            className="absolute top-2 right-2 text-white/20 hover:text-red-400 p-2 z-10 active:scale-90 transition-transform" 
            onClick={(e) => onDelete(e, item.id)}
        >
            <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Картинка */}
        <div 
            onClick={() => inStock && onEdit(item)}
            className="w-20 h-24 rounded-lg bg-cover bg-center shrink-0 bg-white/5 cursor-pointer border border-white/5 relative" 
            style={{backgroundImage: `url('${item.image_url}')`}}
        >
             {/* Бейдж "Нет в наличии" на картинке */}
             {!inStock && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                     <span className="material-symbols-outlined text-white/50 text-3xl">block</span>
                 </div>
             )}
        </div>

        <div className="flex flex-col justify-between flex-1 py-0.5 min-w-0">
            {/* Заголовок */}
            <div className="pr-8">
                 <h3 className={`text-white text-xs leading-snug font-medium line-clamp-2 ${!inStock && 'line-through text-white/50'}`}>
                    {item.product_name}
                 </h3>
            </div>
            
            {/* Параметры */}
            <div onClick={() => inStock && onEdit(item)} className={`mt-1 ${inStock ? 'cursor-pointer group/edit' : ''}`}>
                {!inStock ? (
                     <div className="inline-block px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                        Нет в наличии
                     </div>
                ) : isWarning ? (
                    <div className="flex items-center gap-1 text-red-400 text-[10px] font-bold uppercase animate-pulse">
                        <span className="material-symbols-outlined text-xs">warning</span>
                        Выбрать размер
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1 bg-black/20 border border-white/10 px-2 py-0.5 rounded text-[10px] text-white/70 group-hover/edit:border-primary/50 transition-colors">
                            <span className="font-mono font-bold">{item.size}</span>
                            <span className="material-symbols-outlined text-[10px] opacity-50">expand_more</span>
                        </div>
                        {item.color && (
                            <div className="flex items-center gap-1 bg-black/20 border border-white/10 px-2 py-0.5 rounded text-[10px] text-white/70">
                                <span className="w-2 h-2 rounded-full border border-white/20" style={{backgroundColor: item.color.toLowerCase() === 'white' ? '#fff' : item.color}}></span>
                                <span className="max-w-[60px] truncate">{item.color}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Цена и Кол-во (Скрываем контролы, если нет в наличии) */}
            {inStock && (
                <div className="flex justify-between items-end mt-2 gap-2">
                    <span className="text-primary font-bold text-base truncate">{(item.final_price_rub * item.quantity).toLocaleString()} ₽</span>
                    
                    <div className="flex items-center gap-1 bg-black/20 rounded-lg p-0.5 border border-white/5 shrink-0">
                        <button className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white active:bg-white/10 rounded-md" onClick={() => onUpdateQuantity(item.id, -1)}>-</button>
                        <span className="text-xs w-5 text-center text-white font-bold">{item.quantity}</span>
                        <button className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white active:bg-white/10 rounded-md" onClick={() => onUpdateQuantity(item.id, 1)}>+</button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
