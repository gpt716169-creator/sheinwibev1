import React, { useState, useEffect, useMemo } from 'react';

export default function Cart({ user, dbUser, setActiveTab }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Адреса (Мои адреса)
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  
  // Поиск ПВЗ 5Post
  const [pvzQuery, setPvzQuery] = useState('');
  const [pvzResults, setPvzResults] = useState([]);
  const [selectedPvz, setSelectedPvz] = useState(null);
  const [loadingPvz, setLoadingPvz] = useState(false);

  // Калькулятор
  const [pointsInput, setPointsInput] = useState('');
  const [currentDiscount, setCurrentDiscount] = useState(0);
  const [promoCodeInput, setPromoCodeInput] = useState('');

  // Баланс
  const userPointsBalance = dbUser?.points || 0;

  // Модалки
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState(null); 
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  // Форма заказа
  const [checkoutForm, setCheckoutForm] = useState({
    name: dbUser?.name || user?.first_name || '',
    phone: dbUser?.phone || '',
    email: dbUser?.email || '',
    deliveryMethod: 'ПВЗ (5Post)', // По умолчанию
    agreed: false,
    customsAgreed: false
  });

  // --- 1. ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    loadCart();
    loadAddresses();
  }, [user]);

  // Дебаунс для поиска ПВЗ
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (pvzQuery.length > 2 && !selectedPvz) {
        searchPvz(pvzQuery);
      }
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [pvzQuery]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const tgId = user?.id || 1332986231;
      const res = await fetch(`https://proshein.com/webhook/get-cart?tg_id=${tgId}`);
      const text = await res.text();
      if (!text) { setItems([]); return; }
      
      const json = JSON.parse(text);
      let loadedItems = json.items || (Array.isArray(json) ? json : []);
      loadedItems = loadedItems.map(i => ({ ...i, quantity: i.quantity || 1 }));
      setItems(loadedItems);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadAddresses = async () => {
      if (!user?.id) return;
      try {
          const res = await fetch(`https://proshein.com/webhook/get-addresses?tg_id=${user.id}`);
          const json = await res.json();
          const list = json.addresses || [];
          setAddresses(list);
      } catch (e) { console.error(e); }
  };

  const searchPvz = async (query) => {
      setLoadingPvz(true);
      try {
          const res = await fetch(`https://proshein.com/webhook/search-pvz?q=${encodeURIComponent(query)}`);
          const json = await res.json();
          setPvzResults(Array.isArray(json) ? json : []);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingPvz(false);
      }
  };

  const selectPvz = (pvz) => {
      setSelectedPvz(pvz);
      setPvzQuery('');
      setPvzResults([]);
  };

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
  };

  const handleDeleteItem = async (e, id) => {
      e.stopPropagation(); 
      if(!window.confirm('Удалить товар из корзины?')) return;
      setItems(prev => prev.filter(i => i.id !== id));
      try {
          await fetch('https://proshein.com/webhook/delete-item', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: id, tg_id: user?.id })
          }); 
      } catch (err) { console.error(err); }
  };

  const handleUseMaxPoints = () => {
      if (subtotal === 0) return;
      const maxAllowed = Math.floor(subtotal * 0.5);
      const toWrite = Math.min(userPointsBalance, maxAllowed, Math.max(0, subtotal - currentDiscount));
      setPointsInput(toWrite.toString());
  };

  const handleApplyCoupon = (discount, minOrder, code) => {
      if (subtotal < minOrder) {
          window.Telegram?.WebApp?.showAlert(`Купон от ${minOrder}₽`);
          return;
      }
      setCurrentDiscount(discount);
      setIsCouponsOpen(false);
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
  };

  const handleManualPromo = () => {
      const code = promoCodeInput.trim().toUpperCase();
      if (!code) return;
      if (code === 'START500') handleApplyCoupon(500, 5000, code);
      else if (code === 'SHEIN100') handleApplyCoupon(100, 1000, code);
      else {
          window.Telegram?.WebApp?.showAlert('Промокод не найден');
          window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('error');
      }
      setPromoCodeInput('');
  };

  const handlePayOrder = async () => {
      if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.email) {
          window.Telegram?.WebApp?.showAlert('Заполните ФИО, Телефон и Email');
          return;
      }

      let finalAddress = '';
      let pickupInfo = null;

      if (checkoutForm.deliveryMethod === 'ПВЗ (5Post)') {
          if (!selectedPvz) {
              window.Telegram?.WebApp?.showAlert('Выберите пункт выдачи 5Post!');
              return;
          }
          finalAddress = `5Post: ${selectedPvz.city}, ${selectedPvz.address} (${selectedPvz.name})`;
          pickupInfo = {
              id: selectedPvz.id,
              postal_code: selectedPvz.postal_code
          };
      } else {
          if (!selectedAddress) {
              window.Telegram?.WebApp?.showAlert('Выберите адрес доставки или добавьте новый');
              return;
          }
          finalAddress = `${selectedAddress.region ? selectedAddress.region + ', ' : ''}${selectedAddress.street}`;
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
                      address: finalAddress,
                      delivery_method: checkoutForm.deliveryMethod,
                      pickup_point_id: pickupInfo?.id,
                      postal_code: pickupInfo?.postal_code
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
          } else { throw new Error(json.message); }
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
          if (i.id === editingItem.id) return { ...i, size: selectedSize, color: selectedColor };
          return i;
      }));
      setEditingItem(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent animate-fade-in pb-36">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 pt-8 pb-4">
        <div className="w-10"></div>
        <h1 className="text-white text-lg font-medium tracking-wide">Корзина</h1>
        <div className="w-10 flex items-center justify-center">
            <span className="material-symbols-outlined text-white/50">shopping_bag</span>
        </div>
      </div>

      {/* Items List */}
      <div className="px-6 space-y-4">
        {loading ? (
            <div className="animate-pulse p-4 text-center text-white/50">Загрузка...</div>
        ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-10 opacity-50">
                <span className="material-symbols-outlined text-[48px] mb-2">production_quantity_limits</span>
                <p>Корзина пуста</p>
            </div>
        ) : (
            items.map(item => (
                <div key={item.id} onClick={() => openEditModal(item)} className="relative group p-3 rounded-2xl bg-dark-card/80 border border-white/5 backdrop-blur-sm flex gap-3 cursor-pointer">
                     <button className="absolute top-3 right-3 text-white/20 hover:text-red-400 p-1 z-10" onClick={(e) => handleDeleteItem(e, item.id)}><span className="material-symbols-outlined text-sm">close</span></button>
                     <div className="w-20 h-24 rounded-lg bg-cover bg-center shrink-0" style={{backgroundImage: `url('${item.image_url}')`}}></div>
                     <div className="flex flex-col justify-between flex-1 py-1">
                         <h3 className="text-white text-xs line-clamp-2 pr-6">{item.product_name}</h3>
                         <div className="flex justify-between items-center mt-2">
                             <span className="text-primary font-bold">{(item.final_price_rub * item.quantity).toLocaleString()} ₽</span>
                             <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1" onClick={e => e.stopPropagation()}>
                                 <button onClick={() => handleQuantity(item.id, -1)}>-</button>
                                 <span className="text-xs">{item.quantity}</span>
                                 <button onClick={() => handleQuantity(item.id, 1)}>+</button>
                             </div>
                         </div>
                     </div>
                </div>
            ))
        )}
      </div>

      {/* Footer Controls */}
      <div className="px-6 mt-6">
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

          {/* --- ВОТ ОН, ВЕРНУЛ БЛОК ПРО ПАСПОРТ --- */}
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
          {/* ------------------------------------- */}

          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3 mb-4">
              <div className="flex justify-between items-center text-sm"><span className="text-white/60">Товары</span><span className="text-white font-medium">{subtotal.toLocaleString()} ₽</span></div>
              {(currentDiscount > 0 || pointsToUse > 0) && (
                  <div className="flex justify-between items-center text-sm text-primary">
                      <span className="text-primary/60">Скидка</span>
                      <span className="font-medium">-{currentDiscount + pointsToUse} ₽</span>
                  </div>
              )}
              <div className="h-px bg-white/10 my-2"></div>
              <div className="flex justify-between items-center"><span className="text-white font-semibold text-lg">Итого</span><span className="text-2xl font-bold text-primary">{finalTotal.toLocaleString()} ₽</span></div>
          </div>
          
          <button 
            onClick={() => {
                if(items.length === 0) return;
                setIsCheckoutOpen(true);
            }}
            className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center gap-3 text-white font-bold text-base shadow-[0_0_20px_rgba(5,150,105,0.4)]"
          >
              <span>Оплатить заказ</span>
          </button>
      </div>

      {/* --- CHECKOUT MODAL --- */}
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
                     
                     <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/50">Контакты</h3>
                     <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={checkoutForm.name} onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} placeholder="ФИО" />
                     <input type="tel" className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={checkoutForm.phone} onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} placeholder="Телефон" />
                     <input type="email" className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={checkoutForm.email} onChange={e => setCheckoutForm({...checkoutForm, email: e.target.value})} placeholder="Email" />

                     <div className="h-px bg-white/5 my-2"></div>

                     <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/50">Доставка</h3>
                     <div className="flex gap-2 mb-2">
                        <button onClick={() => setCheckoutForm({...checkoutForm, deliveryMethod: 'ПВЗ (5Post)'})} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${checkoutForm.deliveryMethod === 'ПВЗ (5Post)' ? 'bg-primary text-[#102216] border-primary' : 'bg-white/5 border-white/10 text-white/60'}`}>5Post (Пятерочка)</button>
                        <button onClick={() => setCheckoutForm({...checkoutForm, deliveryMethod: 'Почта РФ'})} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${checkoutForm.deliveryMethod === 'Почта РФ' ? 'bg-primary text-[#102216] border-primary' : 'bg-white/5 border-white/10 text-white/60'}`}>Почта РФ</button>
                     </div>

                     {/* 5POST LOGIC */}
                     {checkoutForm.deliveryMethod === 'ПВЗ (5Post)' && (
                         <div className="space-y-3 animate-fade-in">
                             {!selectedPvz ? (
                                 <div className="relative">
                                     <span className="material-symbols-outlined absolute left-3 top-3.5 text-white/40">search</span>
                                     <input className="custom-input w-full rounded-xl pl-10 pr-4 py-3 text-sm" placeholder="Город, Улица..." value={pvzQuery} onChange={(e) => { setPvzQuery(e.target.value); if(e.target.value==='') setPvzResults([]); }} />
                                     {loadingPvz && <div className="absolute right-3 top-3.5"><span className="material-symbols-outlined animate-spin text-primary text-sm">progress_activity</span></div>}
                                     {pvzResults.length > 0 && (
                                         <div className="mt-2 bg-[#1c2636] border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                             {pvzResults.map(pvz => (
                                                 <div key={pvz.id} onClick={() => selectPvz(pvz)} className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                                                     <p className="text-white text-sm font-bold">{pvz.city}, {pvz.address}</p>
                                                     <p className="text-white/50 text-[10px]">{pvz.name}</p>
                                                 </div>
                                             ))}
                                         </div>
                                     )}
                                 </div>
                             ) : (
                                 <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl flex justify-between items-center">
                                     <div>
                                         <p className="text-primary text-[10px] font-bold uppercase mb-1">Выбран пункт:</p>
                                         <p className="text-white text-sm font-medium leading-snug">{selectedPvz.city}, {selectedPvz.address}</p>
                                         <p className="text-white/40 text-[10px]">{selectedPvz.name}</p>
                                     </div>
                                     <button onClick={() => setSelectedPvz(null)} className="text-white/50 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                                 </div>
                             )}
                         </div>
                     )}

                     {/* RUSSIAN POST LOGIC */}
                     {checkoutForm.deliveryMethod === 'Почта РФ' && (
                         <div className="space-y-3 animate-fade-in">
                             {addresses.length > 0 ? (
                                 <div className="space-y-2">
                                     {addresses.map(addr => (
                                         <div key={addr.id} onClick={() => setSelectedAddress(addr)} className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedAddress?.id === addr.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10'}`}>
                                             <p className="text-sm text-white font-medium">{addr.region}, {addr.street}</p>
                                             <p className="text-[10px] text-white/50">{addr.full_name}</p>
                                         </div>
                                     ))}
                                     <button onClick={() => setActiveTab('profile')} className="w-full py-2 text-primary text-xs border border-dashed border-primary/30 rounded-lg">Добавить новый адрес в Профиле</button>
                                 </div>
                             ) : (
                                 <div className="text-center py-4">
                                     <p className="text-white/50 text-xs mb-2">Нет сохраненных адресов</p>
                                     <button onClick={() => setActiveTab('profile')} className="text-primary font-bold text-sm">Перейти в профиль</button>
                                 </div>
                             )}
                         </div>
                     )}

                     <div className="h-px bg-white/5 my-2"></div>

                     <div className="flex flex-col gap-3">
                         <div className="flex items-start gap-3">
                             <input type="checkbox" className="mt-1 w-4 h-4 rounded bg-white/5 border-white/20 text-primary" checked={checkoutForm.agreed} onChange={e => setCheckoutForm({...checkoutForm, agreed: e.target.checked})} />
                             <span className="text-xs text-white/60">Я согласен с офертой</span>
                         </div>
                         <div className="flex items-start gap-3">
                             <input type="checkbox" className="mt-1 w-4 h-4 rounded bg-white/5 border-white/20 text-primary" checked={checkoutForm.customsAgreed} onChange={e => setCheckoutForm({...checkoutForm, customsAgreed: e.target.checked})} />
                             <span className="text-xs text-white/60">Согласен предоставить паспортные данные</span>
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

      {/* MODALS: EDIT & COUPONS */}
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
                      <div className="mb-6">
                          <h4 className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-semibold mb-2.5">Размер</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                              {(editingItem.size_options || [{name:'XS'},{name:'S'},{name:'M'},{name:'L'},{name:'XL'}]).map(opt => (
                                  <button key={opt.name} onClick={() => setSelectedSize(opt.name)} className={`w-10 h-10 rounded-lg border text-[12px] font-medium transition-all flex items-center justify-center mr-2 mb-2 ${selectedSize === opt.name ? 'bg-primary text-[#102216] font-bold border-primary shadow-lg shadow-primary/20 scale-110' : 'bg-white/5 border-white/10 text-white/60'}`}>{opt.name}</button>
                              ))}
                          </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-white/5">
                          <button onClick={saveEditedItem} className="bg-primary text-[#102216] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 w-full">Сохранить</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {isCouponsOpen && (
        <div className="fixed inset-0 z-50 bg-[#101622] flex flex-col animate-fade-in">
           <div className="flex items-center justify-between p-6 pt-8 border-b border-white/5 bg-[#101622]/95 backdrop-blur-md">
               <button onClick={() => setIsCouponsOpen(false)} className="flex w-10 h-10 items-center justify-center rounded-full glass text-white">
                   <span className="material-symbols-outlined">close</span>
               </button>
               <h2 className="text-lg font-bold">Мои купоны</h2>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                    <p className="text-white/60 text-sm mb-3">Введите промокод</p>
                    <div className="flex gap-2">
                        <input value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value)} className="custom-input flex-1 h-12 rounded-xl px-4 text-sm uppercase" placeholder="CODE2025" />
                        <button onClick={handleManualPromo} className="bg-primary text-[#102216] font-bold px-6 rounded-xl hover:opacity-90 transition-opacity">ОК</button>
                    </div>
                </div>
                <div>
                    <h3 className="text-white font-bold mb-3">Доступные вам:</h3>
                    <div onClick={() => handleApplyCoupon(100, 1000, 'SHEINWIBE100')} className="bg-surface-dark border border-dashed border-white/20 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 mb-3">
                        <div><p className="text-primary font-bold text-lg">100 ₽ OFF</p><p className="text-white/50 text-xs">При заказе от 1000 ₽</p></div>
                        <button className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-xs font-bold">Применить</button>
                    </div>
                </div>
           </div>
        </div>
      )}

    </div>
  );
}
