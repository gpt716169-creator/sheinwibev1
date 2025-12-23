import React, { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  const [paying, setPaying] = useState(false);

  // --- НОВАЯ ЛОГИКА ОТОБРАЖЕНИЯ НОМЕРА ---
  // Если есть короткий номер -> SHEIN B-124
  // Если нет -> #F47AC10B
  const displayId = order.order_number 
    ? `SHEIN B-${order.order_number}` 
    : `#${order.id.slice(0, 8).toUpperCase()}`;

  // --- БЛОКИРОВКА СКРОЛЛА ---
  const unlockScroll = () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.classList.remove('overflow-hidden');
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { unlockScroll(); };
  }, []);

  const handleClose = (e) => {
      if (e) e.stopPropagation(); 
      unlockScroll(); 
      onClose(); 
  };

  // --- ЛОГИКА ПОВТОРНОЙ ОПЛАТЫ ---
  const handleRepay = async () => {
      setPaying(true);
      try {
          const res = await fetch('https://proshein.com/webhook/get-payment-link', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ order_id: order.id })
          });

          if (!res.ok) {
              throw new Error(`Ошибка сервера: ${res.status}`);
          }

          const json = await res.json();

          if (json.status === 'success' && json.payment_url) {
              window.location.href = json.payment_url;
          } else {
              window.Telegram?.WebApp?.showAlert("Ошибка: " + (json.message || "Некорректный ответ"));
              setPaying(false);
          }
      } catch (e) {
          console.error(e);
          window.Telegram?.WebApp?.showAlert("Не удалось получить ссылку. Попробуйте позже.");
          setPaying(false);
      }
  };

  // --- ФОРМАТИРОВАНИЕ АДРЕСА ---
  const formatAddress = (addr) => {
      if (!addr) return 'Адрес не указан';
      let clean = addr.replace(/Москва г,\s*Москва г/gi, 'Москва г');
      clean = clean.replace(/^,\s*/, '');
      return clean;
  };

  // --- ИСТОРИЯ СТАТУСОВ ---
  const fullHistory = useMemo(() => {
    if (!order.created_at) return [];

    if (order.status === 'waiting_for_pay') {
        return [{
            status: 'Ожидает оплаты',
            location: 'Приложение',
            date: order.created_at,
            isWarning: true
        }];
    }
    if (order.status === 'cancelled') {
        return [{
            status: 'Заказ отменен',
            location: 'Приложение',
            date: order.created_at,
            isError: true
        }];
    }

    const createdDate = new Date(order.created_at);
    const now = new Date();
    const diffMinutes = (now - createdDate) / (1000 * 60);

    const scenario = [
      { time: 0, status: 'Заказ оформлен', location: 'Приложение' },
      { time: 15, status: 'Выкуплен на SHEIN', location: 'SHEIN' },
      { time: 24 * 60, status: 'Сборка заказа', location: 'Склад SHEIN' },
      { time: 2 * 24 * 60, status: 'Заказ отправлен', location: 'Логистика SHEIN' },
      { time: 3 * 24 * 60, status: 'В пути на склад SHEINWIBE', location: 'Транзит' },
      { time: 7 * 24 * 60, status: 'Прибыл на склад SHEINWIBE', location: 'Склад SW' },
      { time: 8 * 24 * 60, status: 'Таможенное оформление', location: 'Таможня' }
    ];

    const virtualHistory = scenario
      .filter(step => diffMinutes >= step.time)
      .map(step => ({
        date: new Date(createdDate.getTime() + step.time * 60000).toISOString(),
        status: step.status,
        location: step.location,
        isVirtual: true
      }));

    let realHistory = [];
    if (order.tracking_history && Array.isArray(order.tracking_history)) {
        realHistory = order.tracking_history;
    }

    const combined = [...virtualHistory, ...realHistory];
    return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [order]);

  const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={handleClose}></div>
        <div className="relative z-10 bg-[#151c28] w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            
            {/* HEADER */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a2333]">
                <div>
                    {/* ЗДЕСЬ ТЕПЕРЬ displayId */}
                    <h2 className="font-bold text-white text-sm">{displayId}</h2>
                    <p className="text-[10px] text-white/40">{formatDate(order.created_at)}</p>
                </div>
                <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>

            {/* BODY */}
            <div className="overflow-y-auto p-4 space-y-5 hide-scrollbar">
                
                {/* ИСТОРИЯ */}
                <div>
                    <h3 className="text-white/40 text-[10px] uppercase font-bold mb-3 tracking-wider">История статусов</h3>
                    <div className="relative pl-2 space-y-0">
                        <div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-white/10"></div>
                        {fullHistory.length === 0 ? (
                            <p className="text-white/30 text-xs pl-6">Ожидание статуса...</p>
                        ) : (
                            fullHistory.map((item, index) => {
                                const isLatest = index === 0;
                                let dotColor = 'bg-[#151c28] border-white/30';
                                if (isLatest) {
                                    if (item.isWarning) dotColor = 'bg-orange-500 border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]';
                                    else if (item.isError) dotColor = 'bg-red-500 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
                                    else dotColor = 'bg-primary border-primary shadow-[0_0_8px_rgba(19,236,91,0.6)]';
                                }
                                return (
                                    <div key={index} className="relative flex gap-3 pb-5 last:pb-0">
                                        <div className={`relative z-10 w-2.5 h-2.5 rounded-full border shrink-0 mt-1.5 ${dotColor}`}></div>
                                        <div>
                                            <p className={`text-xs font-medium leading-tight ${isLatest ? 'text-white' : 'text-white/50'}`}>{item.status}</p>
                                            <div className="flex gap-2 text-[10px] text-white/30 mt-0.5">
                                                <span>{formatDate(item.date)}</span><span>•</span><span>{item.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ТОВАРЫ */}
                <div>
                    <h3 className="text-white/40 text-[10px] uppercase font-bold mb-3 tracking-wider pt-4 border-t border-white/5">Товары</h3>
                    <div className="space-y-2">
                        {(order.order_items || []).map((item, idx) => (
                            <div key={idx} className="flex gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                <div className="w-12 h-14 rounded bg-cover bg-center shrink-0" style={{backgroundImage: `url('${item.image_url}')`}}></div>
                                <div className="min-w-0 flex-1 flex flex-col justify-center">
                                    <p className="text-xs text-white truncate">{item.product_name}</p>
                                    <div className="flex gap-2 mt-1">
                                        {item.size && <span className="text-[10px] bg-white/10 px-1.5 rounded text-white/70">{item.size}</span>}
                                        {item.color && <span className="text-[10px] bg-white/10 px-1.5 rounded text-white/70">{item.color}</span>}
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center text-right">
                                    <span className="text-xs text-white font-bold">{Math.floor(item.price_at_purchase || item.final_price_rub || 0)} ₽</span>
                                    <span className="text-[10px] text-white/40">x{item.quantity}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ДЕТАЛИ */}
                <div className="pt-3 border-t border-white/5 text-xs space-y-3">
                      <div className="flex flex-col gap-1">
                          <span className="text-white/50 text-[10px] uppercase font-bold">Получатель</span>
                          <span className="text-white break-words leading-tight">
                             {order.contact_name || order.user_info?.name || 'Не указано'}
                          </span>
                      </div>
                      <div className="flex flex-col gap-1">
                          <span className="text-white/50 text-[10px] uppercase font-bold">Доставка</span>
                          <span className="text-white break-words leading-tight">
                             {formatAddress(order.delivery_address)}
                          </span>
                      </div>
                      {order.tracking_number && (
                          <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-1">
                              <span className="text-white/50">Трек-номер</span>
                              <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white select-all">{order.tracking_number}</span>
                          </div>
                      )}
                </div>

            </div>

            {/* FOOTER: ОПЛАТА */}
            <div className="p-4 bg-[#1a2333] border-t border-white/5 shrink-0">
                {order.status === 'waiting_for_pay' ? (
                      <button 
                        onClick={handleRepay} 
                        disabled={paying}
                        className="w-full h-12 bg-primary text-[#102216] font-black rounded-xl text-lg uppercase shadow-[0_0_15px_rgba(19,236,91,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2"
                      >
                        {paying ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : `Оплатить ${Math.floor(order.total_amount).toLocaleString()} ₽`}
                      </button>
                ) : (
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">Итого:</span>
                        <span className="text-lg font-bold text-primary">{Number(order.total_amount).toLocaleString()} ₽</span>
                    </div>
                )}
            </div>

        </div>
    </div>,
    document.body
  );
}
