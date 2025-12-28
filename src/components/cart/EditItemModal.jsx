import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getColorStyle } from '../../utils/colorUtils';

export default function EditItemModal({ item, onClose, onSave, saving }) {
  const [tempSize, setTempSize] = useState(item?.size === 'NOT_SELECTED' ? null : item?.size);
  const [tempColor, setTempColor] = useState(item?.color);

  // Блокируем скролл основной страницы, пока открыто окно
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = 'auto';
  }, []);

  if (!item) return null;

  const handleSave = () => {
    if (!tempSize) {
      window.Telegram?.WebApp?.showAlert('Выберите размер!');
      return;
    }
    onSave(item.id, tempSize, tempColor);
  };

  let sizeOptions = [];
  try {
    sizeOptions = typeof item.size_options === 'string'
      ? JSON.parse(item.size_options)
      : (item.size_options || []);
  } catch (e) { }

  // --- ВОТ ГЛАВНОЕ ИЗМЕНЕНИЕ ---
  // Мы используем createPortal, чтобы рендерить это окно ПРЯМО В BODY,
  // минуя все родительские блоки, скроллы и трансформации.
  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} // Дублируем стили для надежности
    >
      <div
        className="bg-[#151c28] w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl relative mt-safe-top"
        onClick={e => e.stopPropagation()}
      >

        {/* Хедер */}
        <div className="flex gap-4 p-5 border-b border-white/5 bg-[#1a2332]">
          <div className="w-16 h-20 rounded-lg bg-cover bg-center shrink-0 bg-white/5 border border-white/10" style={{ backgroundImage: `url('${item.image_url}')` }}></div>
          <div className="flex flex-col justify-center pr-8 min-w-0">
            <h3 className="text-white font-bold text-sm leading-tight truncate">{item.product_name}</h3>
            <p className="text-white/40 text-xs mt-1">Параметры товара</p>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white p-2">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Контент */}
        <div className="p-5 space-y-5">
          {/* Размер */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Размер</h4>
              <span className="text-primary text-[10px] font-bold">{tempSize || 'Не выбран'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.length === 0 ? <p className="text-white/30 text-xs">Нет вариантов</p> :
                sizeOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTempSize(opt.name)}
                    className={`h-10 px-4 min-w-[45px] rounded-xl border text-xs font-bold transition-all ${tempSize === opt.name ? 'bg-white text-black border-white shadow-lg transform scale-105' : 'bg-white/5 border-white/10 text-white/70'}`}
                  >
                    {opt.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Цвет */}
          {item.color && (
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-white/50 font-bold mb-3">Цвет</h4>
              <div
                onClick={() => setTempColor(item.color)}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer ${tempColor === item.color ? 'border-primary' : 'border-white/10'}`}
                style={{ background: getColorStyle(item.color) }} // <-- FIX
              >
                {tempColor === item.color && <span className="material-symbols-outlined text-black/50 font-bold">check</span>}
              </div>
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="p-5 pt-2 bg-[#151c28]">
          <button onClick={handleSave} disabled={saving} className="w-full h-12 bg-primary text-[#102216] font-bold rounded-xl text-sm uppercase shadow-lg active:scale-95 transition-transform">
            {saving ? 'Сохранение...' : 'Применить'}
          </button>
        </div>
      </div>
    </div>,
    document.body // <-- ВОТ КЛЮЧ: Рендерим прямо в body
  );
}
