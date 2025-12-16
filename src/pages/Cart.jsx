import React, { useState, useEffect, useMemo } from 'react';

export default function Cart({ user, dbUser, setActiveTab }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Состояние калькулятора
  const [pointsInput, setPointsInput] = useState('');
  const [currentDiscount, setCurrentDiscount] = useState(0);
  const [promoCodeInput, setPromoCodeInput] = useState('');

  // Баланс берем из базы (или 0, если данных нет)
  const userPointsBalance = dbUser?.points || 0;

  // Состояние модалок
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);
  
  // Состояние редактирования товара
  const [editingItem, setEditingItem] = useState(null); 
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  // Состояние формы заказа (Заполняем данными из профиля)
  const [checkoutForm, setCheckoutForm] = useState({
    name: dbUser?.name || user?.first_name || '',
    phone: dbUser?.phone || '',
    email: dbUser?.email || '',
    address: dbUser?.address || '', // Если в базе есть адрес
    deliveryMethod: 'ПВЗ (5Post)',
    isDeliveryToggle: false,
    agreed: false,
    customsAgreed: false
  });

  // Обновляем форму, если dbUser загрузился позже
  useEffect(() => {
    if (dbUser) {
        setCheckoutForm(prev => ({
            ...prev,
            name: prev.name || dbUser.name,
            phone: prev.phone || dbUser.phone,
            email: prev.email || dbUser.email
        }));
    }
  }, [dbUser]);

  // --- 1. ЗАГРУЗКА КОРЗИНЫ ---
  const loadCart = async () => {
    setLoading(true);
    try {
      const tgId = user?.id || 1332986231;
      const res = await fetch(`https://proshein.com/webhook/get-cart?tg_id=${tgId}`);
      const text = await res.text();
      
      if (!text) {
          setItems([]);
          return;
      }
      
      const json = JSON.parse(text);
      let loadedItems = json.items || (Array.isArray(json) ? json : []);
      
      // Гарантируем количество
      loadedItems = loadedItems.map(i => ({ ...i, quantity: i.quantity || 1 }));
      setItems(loadedItems);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [user]);

  // --- 2. МАТЕМАТИКА ---
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.final_price_rub || 0) * item.quantity, 0);
  }, [items]);

  const pointsToUse = Math.min(parseInt(pointsInput) || 0, userPointsBalance);
  const finalTotal = Math.max(0, subtotal - currentDiscount - pointsToUse);

  // --- 3. ДЕЙСТВИЯ ---
  
  const handleQuantity = (id, delta) => {
    setItems(prev => prev.map(item => {
        if (item.id === id) {
            const newQ = Math.max(1, item.quantity + delta);
            return { ...item, quantity: newQ };
        }
        return item;
    }));
    // Здесь можно добавить запрос к webhook/update-cart-item
  };

  const handleDeleteItem = async (e, id) => {
      e.stopPropagation(); 
      
      if(!window.confirm('Удалить товар из корзины?')) return;

      // Оптимистичное удаление
      setItems(prev => prev.filter(i => i.id !== id));

      try {
          // Реальное удаление
          await fetch('https://proshein.com/webhook/delete-item', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: id, tg_id: user?.id })
          }); 
          window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
      } catch (err) {
          console.error(err);
      }
  };

  const handleUseMaxPoints = () => {
      if (subtotal === 0) return;
      // Лимит списания 50%
      const maxAllowed = Math.floor(subtotal * 0.5);
      const toWrite = Math.min(userPointsBalance, maxAllowed, Math.max(0, subtotal - currentDiscount));
      setPointsInput(toWrite.toString());
  };

  // Применение купона
  const handleApplyCoupon = (discount, minOrder, code) => {
      if (subtotal < minOrder) {
          window.Telegram?.WebApp?.showAlert(`Купон от ${minOrder}₽`);
          return;
      }
      setCurrentDiscount(discount);
      setIsCouponsOpen(false);
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
  };

  // Ручной ввод промокода (Пока локальная проверка, позже заменить на fetch)
  const handleManualPromo = () => {
      const code = promoCodeInput.trim().toUpperCase();
      if (!code) return;

      if (code === 'START500') {
          handleApplyCoupon(500, 5000, code);
      } else if (code === 'SHEIN100') {
          handleApplyCoupon(100, 1000, code);
      } else {
          window.Telegram?.WebApp?.showAlert('Промокод не найден или условия не выполнены');
          window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('error');
      }
      setPromoCodeInput('');
  };

  const handlePayOrder = async () => {
      if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address || !checkoutForm.email) {
          window.Telegram?.WebApp?.showAlert('Заполните все поля');
          return;
      }
      if (!checkoutForm.agreed) {
          window.Telegram?.WebApp?.showAlert('Примите условия оферты');
          return;
      }
      if (!checkoutForm.customsAgreed) {
          window.Telegram?.WebApp?.showAlert('Подтвердите согласие для таможни');
          return;
      }

      window.Telegram?.WebApp?.MainButton.showProgress();
      
      try {
          const res = await fetch('https://proshein.com/webhook/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  tg_id: user?.id || 1332986231,
                  user_info: {
                      name: checkoutForm.name,
                      phone: checkoutForm.phone,
                      email: checkoutForm.email,
                      address: checkoutForm.address,
                      delivery_method: checkoutForm.deliveryMethod
                  },
                  final_total: finalTotal,
                  discount_applied: currentDiscount + pointsToUse,
                  items: items
              })
          });
          
          const json = await res.json();
          if (json.status === 'success') {
              window.Telegram?.WebApp?.showAlert(`Заказ #${json.order_id} создан!`);
              setIsCheckoutOpen(false);
              setItems([]); 
              setActiveTab('home'); 
          } else {
              throw new Error(json.message);
          }
      } catch (e) {
          window.Telegram?.WebApp?.showAlert('Ошибка создания заказа');
      } finally {
          window.Telegram?.WebApp?.MainButton.hideProgress();
      }
  };

  // Редактирование товара
  const openEditModal = (item) => {
      setEditingItem(item);
      setSelectedSize(item.size === 'NOT_SELECTED' ? null : item.size);
      setSelectedColor(item.color || 'As shown');
  };

  const saveEditedItem = () => {
      if (!selectedSize) {
          window.Telegram?.WebApp?.showAlert('Выберите размер');
          return;
      }
      setItems(prev => prev.map(i => {
          if (i.id === editingItem.id) {
              return { ...i, size: selectedSize, color: selectedColor };
          }
          return i;
      }));
      setEditingItem(null);
      // Здесь позже добавим fetch('webhook/update-cart-item')
  };

  return (
    // FIX: Изменили h-full на h-screen и добавили overflow-y-auto сюда, чтобы скроллилась вся страница
    <div className="flex flex-col h-screen overflow-y-auto animate-fade-in pb-32">
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 pt-8 pb-4 shrink-0">
        <div className="w-10"></div>
        <h1 className="text-white text-lg font-medium tracking-wide">Корзина</h1>
        <div className="w-10 flex items-center justify-center">
            <span className="material-symbols-outlined text-white/50">shopping_bag</span>
        </div>
      </div>

      {/* Items List */}
      {/* FIX: Убрали flex-1 и overflow-y-auto, теперь это просто список в потоке */}
      <div className="px-6 space-y-4 relative z-10 min-h-[200px]">
        {loading ? (
            <div className="animate-pulse flex gap-4 p-4 border border-white/5 rounded-2xl">
                 <div className="bg-white/10 w-24 h-24 rounded-xl"></div>
                 <div className="flex-1 space-y-2 py-2">
                     <div className="h-4 bg-white/10 rounded w-3/4"></div>
                     <div class="h-3 bg-white/10 rounded w-1/2"></div>
                 </div>
            </div>
        ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-10 opacity-50">
                <span className="material-symbols-outlined text-[48px] mb-2">production_quantity_limits</span>
                <p>Корзина пуста</p>
            </div>
        ) : (
            items.map(item => {
                const isWarning = item.size === 'NOT_SELECTED' || !item.size;
                return (
                    <div 
                        key={item.id} 
                        onClick={() => openEditModal(item)}
                        className={`relative group p-3 rounded-2xl bg-dark-card/80 border backdrop-blur-sm overflow-hidden transition-all duration-300 hover:bg-dark-card mb-3 cursor-pointer active:scale-[0.99] ${isWarning ? 'border-red-500/30 bg-red-900/5' : 'border-white/5'}`}
                    >
                        {/* Кнопка удаления */}
                        <button 
                            className="absolute top-3 right-3 text-white/20 hover:text-red-400 transition-colors p-1 z-20" 
                            onClick={(e) => handleDeleteItem(e, item.id)}
                        >
                            <span className="material-symbols-outlined" style={{fontSize: '18px'}}>close</span>
                        </button>

                        <div className="flex gap-3 pointer-events-none">
                             <div className="relative w-20 h-24 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/5 shadow-md">
                                 <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url('${item.image_url}')`}}></div>
                             </div>
                             <div className="flex flex-col flex-1 justify-between py-0.5">
                                 <div>
                                     <h3 className="text-white font-medium text-xs leading-tight pr-6 line-clamp-2 mb-1">{item.product_name}</h3>
                                     {isWarning ? (
                                         <button className="mt-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg px-2 py-1 text-[10px] font-bold animate-pulse pointer-events-none flex items-center gap-1">
                                             <span className="material-symbols-outlined text-[12px]">warning</span> Выберите параметры
                                         </button>
                                     ) : (
                                         <div className="flex flex-wrap gap-2 mt-2">
                                             <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-white/70">{item.size}</span>
                                             <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-white/70 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-white/50"></span> {item.color || 'As shown'}
                                             </span>
                                         </div>
                                     )}
                                 </div>
                                 <div className="flex items-center justify-between mt-2">
                                     <span className="text-primary font-bold text-base">{(item.final_price_rub * item.quantity).toLocaleString()} ₽</span>
                                     <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1 border border-white/5 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                         <button className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white" onClick={() => handleQuantity(item.id, -1)}>
                                             <span className="material-symbols-outlined text-[14px]">remove</span>
                                         </button>
                                         <span className="text-white font-medium text-xs w-3 text-center">{item.quantity}</span>
                                         <button className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white" onClick={() => handleQuantity(item.id, 1)}>
                                             <span className="material-symbols-outlined text-[14px]">add</span>
                                         </button>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* Footer Controls */}
      {/* FIX: Этот блок теперь идет просто следом за товарами, он не прилипает к низу экрана */}
      <div className="px-6 mt-4 relative z-10 shrink-0">
          <div className="flex gap-3 mb-4">
              <button onClick={() => setIsCouponsOpen(true)} className={`flex-1 bg-dark-card border rounded-xl h-12 flex items-center justify-center gap-2 text-sm transition-colors ${currentDiscount > 0 ? 'border-primary text-primary' : 'border-white/10 text-white hover:bg-white/5'}`}>
                  <span className="material-symbols-outlined text-[18px]">sell</span>
                  {currentDiscount > 0 ? `Скидка -${currentDiscount}₽` : 'Ввести промокод'}
              </button>
          </div>
          <div className="mb-4 relative">
              <input 
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                  className="custom-input w-full rounded-xl px-4 h-12 text-sm" 
                  type="number" 
                  placeholder={`Списать WIBE (доступно: ${userPointsBalance})`} 
              />
              <button onClick={handleUseMaxPoints} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary text-xs font-bold uppercase cursor-pointer hover:opacity-80">МАКС</button>
          </div>

          {/* Видео про Таможню */}
          <div onClick={() => window.Telegram?.WebApp?.openLink('https://youtube.com/shorts/placeholder')} className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-blue-500/20 transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                   <span className="material-symbols-outlined text-[18px]">play_circle</span>
              </div>
              <div className="flex-1">
                   <p className="text-white text-xs font-bold">Таможня и паспорт</p>
                   <p className="text-white/40 text-[10px]">Зачем это нужно? (1 мин)</p>
              </div>
              <span className="material-symbols-outlined text-white/30 text-[16px]">chevron_right</span>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3 mb-4">
              <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Товары ({items.length})</span>
                  <span className="text-white font-medium">{subtotal.toLocaleString()} ₽</span>
              </div>
              {(currentDiscount > 0 || pointsToUse > 0) && (
                  <div className="flex justify-between items-center text-sm text-primary">
                      <span className="text-primary/60">Скидка</span>
                      <span className="font-medium">
                        {currentDiscount > 0 && `Купон: -${currentDiscount} `}
                        {pointsToUse > 0 && `WIBE: -${pointsToUse}`}
                      </span>
                  </div>
              )}
              <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Доставка</span>
                  <span className="text-primary font-medium">Бесплатно</span>
              </div>
              <div className="h-px bg-white/10 my-2"></div>
              <div className="flex justify-between items-center">
                  <span className="text-white font-semibold text-lg">Итого</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">{finalTotal.toLocaleString()} ₽</span>
              </div>
          </div>
          
          <button 
            onClick={() => {
                if(items.length === 0) return;
                if(items.some(i => i.size === 'NOT_SELECTED')) {
                    window.Telegram?.WebApp?.showAlert('Выберите размеры для всех товаров!');
                    return;
                }
                setIsCheckoutOpen(true);
            }}
            className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center gap-3 text-white font-bold text-base shadow-[0_0_25px_rgba(5,150,105,0.4)] hover:shadow-[0_0_35px_rgba(5,150,105,0.6)] active:scale-[0.98] transition-all"
          >
              <span>Оплатить заказ</span>
              <span className="material-symbols-outlined">arrow_forward</span>
          </button>
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Checkout Overlay */}
      {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 bg-[#101622] flex flex-col animate-fade-in">
             <div className="flex items-center justify-between p-6 pt-8 border-b border-white/5 bg-[#101622]/95 backdrop-blur-md">
                 <button onClick={() => setIsCheckoutOpen(false)} className="flex w-10 h-10 items-center justify-center rounded-full glass text-white">
                     <span className="material-symbols-outlined">close</span>
                 </button>
                 <h2 className="text-lg font-bold">Оформление</h2>
                 <div className="w-10"></div>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 <div className="flex flex-col gap-4 bg-surface-dark/50 p-5 rounded-2xl border border-white/5">
                     <div className="space-y-1.5">
                         <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">ФИО</label>
                         <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={checkoutForm.name} onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} placeholder="Иванов Иван" />
                     </div>
                     <div className="space-y-1.5">
                         <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">Телефон</label>
                         <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" type="tel" value={checkoutForm.phone} onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} placeholder="+7 999 ..." />
                     </div>
                     <div className="space-y-1.5">
                         <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">Email</label>
                         <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" type="email" value={checkoutForm.email} onChange={e => setCheckoutForm({...checkoutForm, email: e.target.value})} placeholder="mail@example.com" />
                     </div>
                     <div className="h-px bg-white/5 my-2"></div>
                     <div className="space-y-3">
                         <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">Доставка</label>
                         <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer">
                             <div className="relative flex items-center">
                                 <input type="checkbox" className="peer sr-only" checked={checkoutForm.isDeliveryToggle} onChange={e => setCheckoutForm({...checkoutForm, isDeliveryToggle: e.target.checked, deliveryMethod: e.target.checked ? 'Почта РФ' : 'ПВЗ (5Post)'})} />
                                 <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                             </div>
                             <span className="text-sm font-medium text-white">{checkoutForm.isDeliveryToggle ? 'Почта РФ' : 'ПВЗ (5Post)'}</span>
                         </label>
                         <div>
                             <label className="text-[11px] font-bold uppercase tracking-wider text-primary ml-1">Адрес</label>
                             <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} placeholder="Город, Улица, Дом" />
                         </div>
                     </div>
                     
                     {/* Галочки согласия */}
                     <div className="flex flex-col gap-3 mt-2">
                         <div className="flex items-start gap-3">
                             <input type="checkbox" id="terms" className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-0 cursor-pointer" checked={checkoutForm.agreed} onChange={e => setCheckoutForm({...checkoutForm, agreed: e.target.checked})} />
                             <label htmlFor="terms" className="text-xs text-white/60 cursor-pointer">Я согласен с условиями <span className="text-primary underline">Публичной оферты</span></label>
                         </div>
                         <div className="flex items-start gap-3">
                             <input type="checkbox" id="customs" className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-0 cursor-pointer" checked={checkoutForm.customsAgreed} onChange={e => setCheckoutForm({...checkoutForm, customsAgreed: e.target.checked})} />
                             <label htmlFor="customs" className="text-xs text-white/60 cursor-pointer">Я согласен предоставить <span className="text-white">паспортные данные</span> для таможенного оформления (только для первого заказа)</label>
                         </div>
                     </div>

                 </div>
             </div>
             <div className="p-6 border-t border-white/10 bg-[#101622]/95 pb-8">
                 <button onClick={handlePayOrder} className="w-full h-14 bg-primary text-[#101622] font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(19,236,91,0.3)]">
                     Оплатить {finalTotal.toLocaleString()} ₽
                 </button>
             </div>
          </div>
      )}

      {/* 2. Options Overlay (Размер/Цвет) */}
      {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setEditingItem(null)}></div>
              <div className="relative w-full max-w-[340px] bg-[#151c28] border border-white/10 rounded-[2rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="relative w-full h-32 shrink-0">
                      <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url('${editingItem.image_url}')`}}></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#151c28]"></div>
                      <button onClick={() => setEditingItem(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:bg-white hover:text-black transition-all">
                          <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                  </div>
                  <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                      {/* Размеры */}
                      <div className="mb-6">
                          <h4 className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-semibold mb-2.5">Размер</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                              {(editingItem.size_options || [{name:'XS'},{name:'S'},{name:'M'},{name:'L'},{name:'XL'}]).map(opt => (
                                  <button key={opt.name} onClick={() => setSelectedSize(opt.name)} className={`w-10 h-10 rounded-lg border text-[12px] font-medium transition-all flex items-center justify-center mr-2 mb-2 ${selectedSize === opt.name ? 'bg-primary text-[#102216] font-bold border-primary shadow-lg shadow-primary/20 scale-110' : 'bg-white/5 border-white/10 text-white/60'}`}>{opt.name}</button>
                              ))}
                          </div>
                      </div>

                      {/* Цвета */}
                      <div className="mb-6">
                          <h4 className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-semibold mb-2.5">Цвет</h4>
                          <div className="flex items-center gap-3 flex-wrap pl-1">
                               {(() => {
                                   const baseColors = [
                                       {name: editingItem.color || "As shown", hex: "#fff", border: true}, 
                                       {name: "Black", hex: "#000"}, {name: "White", hex: "#fff", border: true},
                                       {name: "Green", hex: "#10b981"}, {name: "Blue", hex: "#3b82f6"}, {name: "Red", hex: "#ef4444"}
                                   ];
                                   const uniqueColors = [...new Map(baseColors.map(c => [c.name, c])).values()];
                                   
                                   return uniqueColors.map(col => (
                                       <button 
                                          key={col.name} 
                                          onClick={() => setSelectedColor(col.name)}
                                          className={`w-8 h-8 rounded-full transition-transform mb-2 ${selectedColor === col.name ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-[#151c28]' : 'hover:scale-110 ring-1 ring-white/10'}`}
                                          style={{backgroundColor: col.hex, border: (col.hex === '#fff' || col.border) ? '1px solid rgba(255,255,255,0.3)' : 'none'}}
                                       />
                                   ));
                               })()}
                          </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-white/5">
                          <button onClick={saveEditedItem} className="bg-primary text-[#102216] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 w-full">Сохранить</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 3. Coupons Overlay */}
      {isCouponsOpen && (
        <div className="fixed inset-0 z-50 bg-[#101622] flex flex-col animate-fade-in">
           <div className="flex items-center justify-between p-6 pt-8 border-b border-white/5 bg-[#101622]/95 backdrop-blur-md">
               <button onClick={() => setIsCouponsOpen(false)} className="flex w-10 h-10 items-center justify-center rounded-full glass text-white">
                   <span className="material-symbols-outlined">close</span>
               </button>
               <h2 className="text-lg font-bold">Мои купоны</h2>
               <div className="w-10"></div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Ручной ввод */}
                <div>
                    <p className="text-white/60 text-sm mb-3">Введите промокод</p>
                    <div className="flex gap-2">
                        <input 
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            className="custom-input flex-1 h-12 rounded-xl px-4 text-sm uppercase" 
                            placeholder="CODE2025" 
                        />
                        <button onClick={handleManualPromo} className="bg-primary text-[#102216] font-bold px-6 rounded-xl hover:opacity-90 transition-opacity">ОК</button>
                    </div>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-3">Доступные вам:</h3>
                    <div onClick={() => handleApplyCoupon(100, 1000, 'SHEINWIBE100')} className="bg-surface-dark border border-dashed border-white/20 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 mb-3">
                        <div><p className="text-primary font-bold text-lg">100 ₽ OFF</p><p className="text-white/50 text-xs">При заказе от 1000 ₽</p></div>
                        <button className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-xs font-bold">Применить</button>
                    </div>
                    <div onClick={() => handleApplyCoupon(500, 5000, 'VIP500')} className="bg-surface-dark border border-dashed border-white/20 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-white/5">
                        <div><p className="text-gold-accent font-bold text-lg">500 ₽ OFF</p><p className="text-white/50 text-xs">VIP: Заказ от 5000 ₽</p></div>
                        <button className="bg-gold-accent/10 text-gold-accent px-4 py-2 rounded-lg text-xs font-bold">Применить</button>
                    </div>
                </div>
           </div>
        </div>
      )}

    </div>
  );
}
