import React, { useState, useEffect, useMemo } from 'react';
import CartItem from '../components/cart/CartItem';
import AddressBlock from '../components/cart/AddressBlock';
import PaymentBlock from '../components/cart/PaymentBlock';

export default function Cart({ user, dbUser, setActiveTab }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Addresses & Delivery
  const [addresses, setAddresses] = useState([]);
  const [deliveryMethod, setDeliveryMethod] = useState('ПВЗ (5Post)');
  const [selectedAddress, setSelectedAddress] = useState(null);
  
  // 5Post Search
  const [pvzQuery, setPvzQuery] = useState('');
  const [pvzResults, setPvzResults] = useState([]);
  const [selectedPvz, setSelectedPvz] = useState(null);
  const [loadingPvz, setLoadingPvz] = useState(false);

  // Checkout Data
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', agreed: false, customsAgreed: false });

  // Calc
  const [pointsInput, setPointsInput] = useState('');
  const [currentDiscount, setCurrentDiscount] = useState(0);

  // UI State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // --- STATE РЕДАКТИРОВАНИЯ ТОВАРА ---
  const [editingItem, setEditingItem] = useState(null);
  const [tempSize, setTempSize] = useState(null);
  const [tempColor, setTempColor] = useState(null);

  const userPointsBalance = dbUser?.points || 0;

  useEffect(() => {
    if (user?.id) {
        loadCart();
        loadAddresses();
        setContactForm(prev => ({
            ...prev,
            name: dbUser?.name || user.first_name || '',
            phone: dbUser?.phone || '',
            email: dbUser?.email || ''
        }));
    }
  }, [user]);

  // Debounce PVZ
  useEffect(() => {
    const t = setTimeout(() => {
      if (pvzQuery.length > 2 && !selectedPvz) searchPvz(pvzQuery);
    }, 600);
    return () => clearTimeout(t);
  }, [pvzQuery]);

  // --- API ---
  const loadCart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://proshein.com/webhook/get-cart?tg_id=${user?.id}`);
      const json = await res.json();
      setItems((json.items || []).map(i => ({ ...i, quantity: i.quantity || 1 })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadAddresses = async () => {
      try {
          const res = await fetch(`https://proshein.com/webhook/get-addresses?tg_id=${user?.id}`);
          const json = await res.json();
          setAddresses(json.addresses || []);
      } catch (e) { console.error(e); }
  };

  const searchPvz = async (q) => {
      setLoadingPvz(true);
      try {
          const res = await fetch(`https://proshein.com/webhook/search-pvz?q=${encodeURIComponent(q)}`);
          const json = await res.json();
          setPvzResults(Array.isArray(json) ? json : []);
      } catch (e) { console.error(e); } finally { setLoadingPvz(false); }
  };

  // --- LOGIC ---
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (i.final_price_rub * i.quantity), 0), [items]);
  const finalTotal = Math.max(0, subtotal - currentDiscount - (parseInt(pointsInput) || 0));

  const handleUpdateQuantity = (id, delta) => {
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const handleDeleteItem = async (e, id) => {
      if(!window.confirm('Удалить?')) return;
      setItems(prev => prev.filter(i => i.id !== id));
      await fetch('https://proshein.com/webhook/delete-item', { method: 'POST', body: JSON.stringify({ id, tg_id: user?.id }) });
  };

  // --- ОТКРЫТИЕ МОДАЛКИ РЕДАКТИРОВАНИЯ ---
  const openEditModal = (item) => {
      setEditingItem(item);
      setTempSize(item.size === 'NOT_SELECTED' ? null : item.size);
      setTempColor(item.color);
  };

  // --- СОХРАНЕНИЕ ПАРАМЕТРОВ ---
  const saveItemParams = async () => {
      if (!tempSize) {
          window.Telegram?.WebApp?.showAlert('Выберите размер!');
          return;
      }
      
      // Обновляем локально
      setItems(prev => prev.map(i => {
          if (i.id === editingItem.id) {
              return { ...i, size: tempSize, color: tempColor };
          }
          return i;
      }));

      // Тут можно добавить запрос к API для сохранения выбора в базе (webhook/update-cart-item)
      // await fetch(...) 

      setEditingItem(null);
  };

  const handlePay = async () => {
      // Проверка размеров
      if (items.some(i => i.size === 'NOT_SELECTED' || !i.size)) {
          window.Telegram?.WebApp?.showAlert('Выберите размер для всех товаров!');
          return;
      }

      if (!contactForm.name || !contactForm.phone) { window.Telegram?.WebApp?.showAlert('Заполните контакты'); return; }
      if (!contactForm.agreed || !contactForm.customsAgreed) { window.Telegram?.WebApp?.showAlert('Примите соглашения'); return; }
      
      let addressStr = '';
      let pickupInfo = null;

      if (deliveryMethod === 'ПВЗ (5Post)') {
          if (!selectedPvz) { window.Telegram?.WebApp?.showAlert('Выберите ПВЗ'); return; }
          addressStr = `5Post: ${selectedPvz.city}, ${selectedPvz.address} (${selectedPvz.name})`;
          pickupInfo = { id: selectedPvz.id, postal_code: selectedPvz.postal_code };
      } else {
          if (!selectedAddress) { window.Telegram?.WebApp?.showAlert('Выберите адрес'); return; }
          addressStr = `${selectedAddress.region}, ${selectedAddress.street}`;
      }

      window.Telegram?.WebApp?.MainButton.showProgress();
      try {
          const res = await fetch('https://proshein.com/webhook/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  tg_id: user?.id || 1332986231,
                  user_info: {
                      name: contactForm.name,
                      phone: contactForm.phone,
                      email: contactForm.email,
                      address: addressStr,
                      delivery_method: deliveryMethod,
                      pickup_point_id: pickupInfo?.id,
                      postal_code: pickupInfo?.postal_code
                  },
                  final_total: finalTotal,
                  discount_applied: currentDiscount + (parseInt(pointsInput)||0),
                  items: items
              })
          });
          const json = await res.json();
          if (json.status === 'success') {
              window.Telegram?.WebApp?.showAlert(`Заказ #${json.order_id} оформлен!`);
              setIsCheckoutOpen(false); 
              setItems([]);
              setActiveTab('home');
          } else {
              throw new Error(json.message);
          }
      } catch (e) {
          window.Telegram?.WebApp?.showAlert('Ошибка: ' + e.message);
      } finally {
          window.Telegram?.WebApp?.MainButton.hideProgress();
      }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent animate-fade-in pb-32 overflow-y-auto">
      
      <div className="p-6 pt-8 pb-4 flex justify-between items-center">
         <h1 className="text-white text-lg font-medium">Корзина ({items.length})</h1>
      </div>

      {loading ? (
          <div className="text-center text-white/50 mt-10">Загрузка...</div>
      ) : items.length === 0 ? (
          <div className="text-center text-white/50 mt-10">Корзина пуста</div>
      ) : (
          <div className="px-6 space-y-4">
              <div className="space-y-3">
                  {items.map(item => (
                      <CartItem 
                          key={item.id} 
                          item={item} 
                          onEdit={openEditModal} 
                          onDelete={handleDeleteItem} 
                          onUpdateQuantity={handleUpdateQuantity} 
                      />
                  ))}
              </div>
              
              <div className="h-px bg-white/5 my-4"></div>

              <PaymentBlock 
                  subtotal={subtotal} 
                  total={finalTotal} 
                  discount={currentDiscount}
                  pointsInput={pointsInput}
                  setPointsInput={setPointsInput}
                  userPointsBalance={userPointsBalance}
                  handleUseMaxPoints={() => setPointsInput(Math.min(userPointsBalance, subtotal * 0.5))}
                  onOpenCoupons={() => {}} 
                  onPay={() => setIsCheckoutOpen(true)} 
              />
          </div>
      )}

      {/* --- CHECKOUT MODAL --- */}
      {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 bg-[#101622] flex flex-col animate-slide-up">
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                  <button onClick={() => setIsCheckoutOpen(false)} className="text-white/50">Назад</button>
                  <h2 className="text-white font-bold">Оформление</h2>
                  <div className="w-10"></div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* КОНТАКТЫ */}
                  <div className="space-y-3">
                      <h3 className="text-[10px] uppercase font-bold text-white/50">Получатель</h3>
                      <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" placeholder="ФИО" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} />
                      <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Телефон" type="tel" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} />
                      <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Email" type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} />
                  </div>

                  {/* АДРЕС (Компонент) */}
                  <div className="space-y-3">
                      <h3 className="text-[10px] uppercase font-bold text-white/50">Доставка</h3>
                      <AddressBlock 
                          deliveryMethod={deliveryMethod}
                          setDeliveryMethod={setDeliveryMethod}
                          addresses={addresses}
                          selectedAddress={selectedAddress}
                          setSelectedAddress={setSelectedAddress}
                          pvzQuery={pvzQuery}
                          setPvzQuery={setPvzQuery}
                          pvzResults={pvzResults}
                          selectedPvz={selectedPvz}
                          setSelectedPvz={setSelectedPvz} 
                          loadingPvz={loadingPvz}
                          onOpenProfile={() => setActiveTab('profile')}
                      />
                  </div>

                  {/* СОГЛАШЕНИЯ */}
                  <div className="space-y-2 pt-2">
                      <label className="flex gap-3 items-center">
                          <input type="checkbox" checked={contactForm.agreed} onChange={e => setContactForm({...contactForm, agreed: e.target.checked})} className="rounded bg-white/10 border-white/20 text-primary" />
                          <span className="text-xs text-white/60">Согласен с офертой</span>
                      </label>
                      <label className="flex gap-3 items-center">
                          <input type="checkbox" checked={contactForm.customsAgreed} onChange={e => setContactForm({...contactForm, customsAgreed: e.target.checked})} className="rounded bg-white/10 border-white/20 text-primary" />
                          <span className="text-xs text-white/60">Паспорт для таможни</span>
                      </label>
                  </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-[#101622]">
                  <button onClick={handlePay} className="w-full h-14 bg-primary text-[#102216] font-bold rounded-xl text-lg">
                      Подтвердить {finalTotal.toLocaleString()} ₽
                  </button>
              </div>
          </div>
      )}

      {/* --- МОДАЛКА ВЫБОРА РАЗМЕРА И ЦВЕТА --- */}
      {editingItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setEditingItem(null)}>
               <div className="bg-[#151c28] w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                   
                   {/* Картинка товара сверху */}
                   <div className="relative h-40 w-full shrink-0">
                       <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url('${editingItem.image_url}')`}}></div>
                       <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#151c28]"></div>
                       <button onClick={() => setEditingItem(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white">
                           <span className="material-symbols-outlined text-sm">close</span>
                       </button>
                   </div>

                   <div className="p-6 flex-1 overflow-y-auto">
                       <h3 className="text-white font-bold text-sm mb-4 line-clamp-2">{editingItem.product_name}</h3>

                       {/* ВЫБОР РАЗМЕРА */}
                       <div className="mb-6">
                           <h4 className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-3">Размер</h4>
                           <div className="flex flex-wrap gap-2">
                               {(() => {
                                   // Парсим размеры. В базе это JSON, но n8n мог вернуть уже объект или строку.
                                   let options = [];
                                   try {
                                       options = typeof editingItem.size_options === 'string' 
                                           ? JSON.parse(editingItem.size_options) 
                                           : (editingItem.size_options || []);
                                   } catch (e) { options = []; }

                                   if (options.length === 0) return <p className="text-white/30 text-xs">Нет вариантов</p>;

                                   return options.map((opt, idx) => (
                                       <button 
                                           key={idx} 
                                           onClick={() => setTempSize(opt.name)}
                                           className={`min-w-[40px] h-10 px-3 rounded-lg border text-xs font-bold transition-all ${
                                               tempSize === opt.name 
                                               ? 'bg-primary text-[#102216] border-primary scale-105 shadow-lg shadow-primary/20' 
                                               : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                           }`}
                                       >
                                           {opt.name}
                                       </button>
                                   ));
                               })()}
                           </div>
                       </div>

                       {/* ВЫБОР ЦВЕТА (Если есть опции, иначе показываем текущий) */}
                       <div className="mb-4">
                           <h4 className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-3">Цвет</h4>
                           <div className="flex gap-3">
                               {/* В этом макете мы просто показываем текущий цвет, так как у Shein цвет = другой товар обычно.
                                   Но если бы был массив цветов, мы бы его тут отрендерили так же, как размеры. */}
                               <div 
                                   className={`w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                                       tempColor === editingItem.color ? 'border-primary ring-2 ring-primary/30' : 'border-white/10'
                                   }`}
                                   style={{backgroundColor: editingItem.color?.toLowerCase() === 'white' ? '#fff' : editingItem.color}}
                                   onClick={() => setTempColor(editingItem.color)}
                               >
                                   {tempColor === editingItem.color && <span className="material-symbols-outlined text-xs text-black/50 font-bold">check</span>}
                               </div>
                           </div>
                           <p className="text-white/50 text-xs mt-2">{editingItem.color}</p>
                       </div>
                   </div>

                   {/* КНОПКА СОХРАНИТЬ */}
                   <div className="p-4 border-t border-white/5">
                       <button onClick={saveItemParams} className="w-full h-12 bg-primary text-[#102216] font-bold rounded-xl text-sm uppercase tracking-wide shadow-lg shadow-primary/20">
                           Сохранить
                       </button>
                   </div>
               </div>
          </div>
      )}
    </div>
  );
}
