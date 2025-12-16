import React, { useState, useEffect } from 'react';

export default function Profile({ user, dbUser }) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);

  // --- State для Адресов ---
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  
  const [addressForm, setAddressForm] = useState({
      id: null,
      full_name: '',
      phone: '',
      email: '',
      region: '',
      street: '',
      is_default: false
  });

  // 1. ЗАГРУЗКА ДАННЫХ
  useEffect(() => {
      // Грузим заказы только если есть реальный user
      if(user && user.id) {
          loadOrders();
      } else {
          setLoadingOrders(false);
      }
  }, [user]);

  const loadOrders = async () => {
      setLoadingOrders(true);
      try {
          const tgId = user?.id;
          if (!tgId) return; // Если ID нет, не делаем запрос

          const res = await fetch(`https://proshein.com/webhook/get-orders?tg_id=${tgId}`);
          const text = await res.text();
          
          if (!text) { setOrders([]); return; }
          const json = JSON.parse(text);
          
          let list = [];
          if (Array.isArray(json)) list = json;
          else if (json.items) list = json.items;
          else if (json.orders) list = json.orders;
          
          setOrders(list);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingOrders(false);
      }
  };

  const loadAddresses = async () => {
      setLoadingAddresses(true);
      try {
          const tgId = user?.id;
          if (!tgId) return;

          const res = await fetch(`https://proshein.com/webhook/get-addresses?tg_id=${tgId}`);
          const text = await res.text();
          
          if (text) {
              const json = JSON.parse(text);
              const list = json.addresses || (Array.isArray(json) ? json : []);
              setAddresses(list);
          } else {
              setAddresses([]);
          }
      } catch (e) {
          console.error("Ошибка загрузки адресов:", e);
      } finally {
          setLoadingAddresses(false);
      }
  };

  // 2. РЕФЕРАЛЬНАЯ СИСТЕМА
  const copyRefLink = () => {
      if(user && user.id) {
          navigator.clipboard.writeText(`https://t.me/sheinwibe_bot?start=ref_${user.id}`);
          window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
          window.Telegram?.WebApp?.showAlert('Ссылка скопирована');
      }
  };

  const handleWithdraw = async () => {
      if (!user || !user.id) return;

      if (!dbUser || dbUser.referral_balance <= 0) {
          window.Telegram?.WebApp?.showAlert('Недостаточно средств для вывода');
          return;
      }
      
      if(!window.confirm(`Перевести ${dbUser.referral_balance}₽ на бонусный счет?`)) return;

      try {
          window.Telegram?.WebApp?.MainButton.showProgress();
          const res = await fetch('https://proshein.com/webhook/withdraw-referrals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tg_id: user.id })
          });
          const json = await res.json();
          
          if(json.status === 'success') {
              window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
              window.Telegram?.WebApp?.showAlert('Средства зачислены на баланс!');
          } else {
              throw new Error(json.message);
          }
      } catch (e) {
          window.Telegram?.WebApp?.showAlert('Ошибка вывода');
      } finally {
          window.Telegram?.WebApp?.MainButton.hideProgress();
      }
  };

  // 3. УПРАВЛЕНИЕ АДРЕСАМИ
  const openAddressModal = () => {
      loadAddresses();
      setIsAddressModalOpen(true);
      setIsEditingAddress(false);
  };

  const startEditAddress = (addr) => {
      if (addr) {
          setAddressForm(addr);
      } else {
          setAddressForm({
              id: null,
              full_name: user?.first_name || '',
              phone: '',
              email: '',
              region: '',
              street: '',
              is_default: addresses.length === 0
          });
      }
      setIsEditingAddress(true);
  };

  const saveAddress = async () => {
      if(!addressForm.full_name || !addressForm.phone || !addressForm.street) {
           window.Telegram?.WebApp?.showAlert('Заполните обязательные поля');
           return;
      }
      
      window.Telegram?.WebApp?.MainButton.showProgress();

      try {
          const tgId = user?.id;
          if (!tgId) throw new Error("User ID not found");

          const res = await fetch('https://proshein.com/webhook/save-address', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  tg_id: tgId,
                  address: addressForm
              })
          });
          
          const json = await res.json();
          if (json.status === 'success') {
              await loadAddresses(); 
              setIsEditingAddress(false);
              window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
          } else {
              throw new Error(json.message);
          }
      } catch (e) {
          console.error(e);
          window.Telegram?.WebApp?.showAlert('Ошибка сохранения');
      } finally {
          window.Telegram?.WebApp?.MainButton.hideProgress();
      }
  };

  const deleteAddress = async (id) => {
      if(!window.confirm('Удалить адрес?')) return;
      
      setAddresses(prev => prev.filter(a => a.id !== id));

      try {
         await fetch('https://proshein.com/webhook/delete-address', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: id })
         });
         window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
      } catch(e) {
         console.error(e);
         loadAddresses();
      }
  };

  // 4. ДЕТАЛИ ЗАКАЗА
  const openOrderDetails = (orderId) => {
      const order = orders.find(o => o.id === orderId);
      if(order) setSelectedOrder(order);
  };

  const renderTimeline = (status, date) => {
      const steps = [
        { id: 'paid', label: 'Оплачен', icon: 'credit_score' },
        { id: 'purchased', label: 'Выкуплен (Shein)', icon: 'shopping_bag' },
        { id: 'warehouse_cn', label: 'Склад Китай', icon: 'warehouse' },
        { id: 'shipping', label: 'В пути в РФ', icon: 'flight_takeoff' },
        { id: 'arrived_ru', label: 'Прибыл в РФ', icon: 'flag' },
        { id: 'delivery', label: 'В доставке', icon: 'local_shipping' }
      ];
      
      let activeIndex = steps.findIndex(s => s.id === status);
      if (activeIndex === -1) activeIndex = 0; 

      return steps.map((step, index) => {
          const isCompleted = index <= activeIndex;
          const isCurrent = index === activeIndex;
          
          let colorClass = isCompleted ? 'bg-primary text-black border-primary' : 'bg-[#101622] text-white/20 border-white/10';
          let textClass = isCompleted ? 'text-white' : 'text-white/30';
          let subText = '';

          if (index === 0) subText = new Date(date).toLocaleDateString('ru-RU');
          if (isCurrent && index > 0) subText = 'Текущий статус';

          return (
              <div key={step.id} className="relative flex items-center gap-4 z-10">
                   <div className={`w-6 h-6 rounded-full ${colorClass} flex items-center justify-center shrink-0 border-2 transition-all ${isCurrent ? 'shadow-[0_0_15px_rgba(19,236,91,0.5)] scale-110' : ''}`}>
                       <span className="material-symbols-outlined text-[14px]">{step.icon}</span>
                   </div>
                   <div>
                       <p className={`text-sm font-medium ${textClass}`}>{step.label}</p>
                       {subText && <p className="text-[10px] text-primary/80 font-medium">{subText}</p>}
                   </div>
              </div>
          );
      });
  };

  const visibleOrders = isOrdersExpanded ? orders : orders.slice(0, 3);

  return (
    <div className="flex flex-col h-full animate-fade-in pb-24">
        {/* Header */}
        <div className="relative z-10 flex items-center justify-center p-6 pt-8 pb-4">
            <h2 className="text-white text-lg font-bold leading-tight text-center">Профиль</h2>
        </div>

        {/* Profile Card */}
        <div className="flex flex-col items-center pt-2 relative z-10">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-600 rounded-full opacity-75 blur"></div>
                <div className="relative bg-center bg-no-repeat bg-cover rounded-full h-24 w-24 ring-4 ring-[#102216]" 
                     style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAC502xdtgtUxB0-TaDsDJ2yB-sA5STxZ5K7wUUYSahfcwKfGfNfFTeU4c_3JHlka06UQ7khXYsmdNG2X6qroQodhf5VQ8jhT9bJINpACTXXwCG2tUB6ITSFDOKskXtPka2WPY3TwuJ_qKO4jgL_OriHT8jJYx3rlrKzS8EVmfMf0UnBaAa7ihyJm3W6RQBFR_HsTgJDkf0RHovw-IZmdsezNPGvS-Vx8wux_eDPTFoFC7YPYEHRztsAYNodW3TxrruVco7D5WrMe8u")'}}>
                </div>
            </div>
            <h2 className="text-white text-xl font-bold mt-4">{user?.first_name || '...'}</h2>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/5 mt-2">
                <span className="material-symbols-outlined text-[#cd7f32] text-[16px]">star</span>
                <p className="text-[#cd7f32] text-xs font-bold uppercase tracking-wider">{dbUser?.status || 'Bronze'}</p>
            </div>
        </div>

        <div className="px-6 pt-8 space-y-4 relative z-10">
            {/* Referral System */}
            <div className="bg-card-gradient border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                    <span class="text-white font-bold">Мои рефералы</span>
                    <span class="text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">Доход: {dbUser?.referral_balance || 0} ₽</span>
                </div>
                <div className="flex gap-2">
                    <input className="custom-input flex-1 h-10 rounded-lg text-xs px-3" value={user?.id ? `https://t.me/sheinwibe_bot?start=ref_${user.id}` : '...'} readOnly />
                    <button onClick={copyRefLink} className="bg-white/10 w-10 h-10 rounded-lg flex items-center justify-center text-white hover:bg-white/20">
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                </div>
                <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gray-500 border border-[#102216]"></div>
                            <div className="w-6 h-6 rounded-full bg-gray-600 border border-[#102216]"></div>
                            <div className="w-6 h-6 rounded-full bg-gray-700 border border-[#102216] flex items-center justify-center text-[8px] text-white">+0</div>
                        </div>
                        <span className="text-white/40 text-xs">Приглашено: 0 чел.</span>
                    </div>
                    <button onClick={handleWithdraw} className="text-[10px] font-bold uppercase text-primary border border-primary/30 rounded-lg px-2 py-1 hover:bg-primary/10 transition-colors">
                        Вывести в баллы
                    </button>
                </div>
            </div>
            
            {/* MENU BUTTONS */}
            <div className="space-y-3">
                 <div onClick={openAddressModal} className="p-4 rounded-xl bg-surface-dark border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-white/60">location_on</span>
                        <span className="text-white font-medium">Мои адреса</span>
                    </div>
                    <span className="material-symbols-outlined text-white/30">chevron_right</span>
                </div>

                <div className="p-4 rounded-xl bg-surface-dark border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-white/60">support_agent</span>
                        <span className="text-white font-medium">Поддержка</span>
                    </div>
                    <span className="material-symbols-outlined text-white/30">chevron_right</span>
                </div>
            </div>

            {/* Orders List */}
            <div className="pt-2">
                <div className="flex justify-between items-end mb-4 px-1">
                    <h3 className="text-white font-bold text-lg">Мои заказы</h3>
                    <button onClick={loadOrders} className="text-primary/50 text-xs flex items-center gap-1 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                    </button>
                </div>
                
                <div className="space-y-3 min-h-[100px]">
                    {loadingOrders ? (
                         <div className="animate-pulse h-20 bg-white/5 rounded-2xl border border-white/5"></div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 opacity-30">
                             <span className="material-symbols-outlined text-4xl mb-2">history</span>
                             <p className="text-xs">История заказов пуста</p>
                        </div>
                    ) : (
                        <>
                            {visibleOrders.map(order => (
                                <div key={order.id} onClick={() => openOrderDetails(order.id)} className="bg-surface-dark border border-white/5 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 active:scale-95 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-[20px]">local_mall</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">Заказ #{order.id.substring(0,8).toUpperCase()}</p>
                                            <p className="text-white/40 text-xs">{new Date(order.created_at).toLocaleDateString()} • {order.order_items?.length || 0} тов.</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">{order.total_amount.toLocaleString()} ₽</p>
                                        <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">{order.status === 'paid' ? 'Оплачен' : order.status}</p>
                                    </div>
                                </div>
                            ))}
                            
                            {orders.length > 3 && (
                                <button 
                                    onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
                                    className="w-full py-3 text-sm text-white/50 hover:text-white bg-white/5 rounded-xl transition-colors"
                                >
                                    {isOrdersExpanded ? 'Свернуть' : `Показать все (${orders.length})`}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* --- ADDRESS MODAL --- */}
        {isAddressModalOpen && (
            <div className="fixed inset-0 z-50 bg-[#101622] flex flex-col animate-fade-in">
                <div className="flex items-center justify-between p-6 pt-8 border-b border-white/5 bg-[#101622]/95 backdrop-blur-md">
                    <button onClick={isEditingAddress ? () => setIsEditingAddress(false) : closeAddressModal} className="flex w-10 h-10 items-center justify-center rounded-full glass text-white">
                        <span className="material-symbols-outlined">{isEditingAddress ? 'arrow_back' : 'close'}</span>
                    </button>
                    <h2 className="text-lg font-bold">{isEditingAddress ? 'Редактировать' : 'Мои адреса'}</h2>
                    <div className="w-10"></div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isEditingAddress ? (
                        <div className="space-y-4">
                             <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">Получатель (ФИО)</label>
                                <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={addressForm.full_name} onChange={e => setAddressForm({...addressForm, full_name: e.target.value})} placeholder="Иванов Иван Иванович" />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">Телефон</label>
                                <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" type="tel" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} placeholder="+7 ..." />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">Email</label>
                                <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" type="email" value={addressForm.email} onChange={e => setAddressForm({...addressForm, email: e.target.value})} placeholder="mail@example.com" />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">Регион / Город</label>
                                <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={addressForm.region} onChange={e => setAddressForm({...addressForm, region: e.target.value})} placeholder="Москва" />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">Адрес</label>
                                <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} placeholder="Улица, Дом, Кв (ПВЗ 5Post)" />
                             </div>
                             <div className="flex items-center gap-3 pt-2">
                                 <input type="checkbox" id="def-addr" checked={addressForm.is_default} onChange={e => setAddressForm({...addressForm, is_default: e.target.checked})} className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-0 cursor-pointer"/>
                                 <label htmlFor="def-addr" className="text-sm text-white/80">Использовать как основной</label>
                             </div>
                             <button onClick={saveAddress} className="w-full h-12 bg-primary text-[#102216] font-bold rounded-xl mt-4">Сохранить</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {loadingAddresses ? (
                                <div className="text-center text-white/30 py-4">Загрузка адресов...</div>
                            ) : addresses.length === 0 ? (
                                <p className="text-center text-white/30 py-10">Нет сохраненных адресов</p>
                            ) : (
                                addresses.map(addr => (
                                    <div key={addr.id} className="bg-surface-dark border border-white/5 rounded-xl p-4 relative group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-sm text-white flex items-center gap-2">
                                                    {addr.full_name}
                                                    {addr.is_default && <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded">Основной</span>}
                                                </p>
                                                <p className="text-xs text-white/60">{addr.phone} • {addr.email}</p>
                                            </div>
                                            <button onClick={() => startEditAddress(addr)} className="text-primary text-xs font-bold uppercase p-2 hover:bg-white/5 rounded">Изм.</button>
                                        </div>
                                        <p className="text-sm text-white/80 leading-snug">{addr.region}, {addr.street}</p>
                                        <button onClick={() => deleteAddress(addr.id)} className="absolute bottom-2 right-2 text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                ))
                            )}
                            <button onClick={() => startEditAddress(null)} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-white/50 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">add</span> Добавить адрес
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- ORDER DETAILS OVERLAY --- */}
        {selectedOrder && (
             <div className="fixed inset-0 z-50 bg-[#101622] flex flex-col animate-fade-in">
                 {/* Header */}
                 <div className="flex items-center justify-between p-6 pt-8 border-b border-white/5 bg-[#101622]/95 backdrop-blur-md">
                     <button onClick={() => setSelectedOrder(null)} className="flex w-10 h-10 items-center justify-center rounded-full glass text-white">
                         <span className="material-symbols-outlined">arrow_back</span>
                     </button>
                     <h2 className="text-lg font-bold">Заказ #{selectedOrder.id.substring(0,8).toUpperCase()}</h2>
                     <div className="w-10"></div>
                 </div>

                 {/* Content */}
                 <div className="flex-1 overflow-y-auto p-6 pb-24 hide-scrollbar">
                     
                     {/* Статус / Трекинг */}
                     <div className="bg-surface-dark border border-white/5 rounded-2xl p-5 mb-6">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest">Статус доставки</h3>
                             <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded">{selectedOrder.status === 'paid' ? 'Оплачен' : selectedOrder.status}</span>
                        </div>
                        <div className="relative pl-2 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
                            {renderTimeline(selectedOrder.status, selectedOrder.created_at)}
                        </div>
                     </div>
                     
                     {/* Товары */}
                     <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3 px-1">Товары ({selectedOrder.order_items?.length || 0})</h3>
                     <div className="space-y-3 mb-6">
                         {selectedOrder.order_items?.map(item => (
                             <div key={item.id} className="flex gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                 <div className="w-12 h-16 rounded bg-black/20 bg-cover bg-center shrink-0" style={{backgroundImage: `url('${item.image_url}')`}}></div>
                                 <div className="flex-1 min-w-0 flex flex-col justify-center">
                                     <p className="text-white text-xs font-medium line-clamp-2 leading-tight">{item.product_name}</p>
                                     <p className="text-white/40 text-[10px] mt-1">
                                         {item.size} • {item.color || '-'} • x{item.quantity || 1}
                                     </p>
                                 </div>
                                 <div className="text-white text-sm font-bold whitespace-nowrap self-center">
                                     {item.price_at_purchase.toLocaleString()} ₽
                                 </div>
                             </div>
                         ))}
                     </div>

                     {/* ИНФО О ДОСТАВКЕ */}
                     <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Получатель</span>
                            <span className="text-white text-right">{selectedOrder.contact_name || 'Не указан'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Телефон</span>
                            <span className="text-white text-right">{selectedOrder.contact_phone || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Адрес</span>
                            <span className="text-white text-right w-1/2 break-words text-xs">{selectedOrder.delivery_address || 'Не указан'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Доставка</span>
                            <span className="text-white text-right">{selectedOrder.delivery_method || 'ПВЗ (5Post)'}</span>
                        </div>
                        <div className="h-px bg-white/10 my-2"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-white font-bold">Итого оплачено</span>
                            <span className="text-primary font-bold text-lg">{selectedOrder.total_amount.toLocaleString()} ₽</span>
                        </div>
                    </div>

                 </div>
             </div>
        )}
    </div>
  );
}
