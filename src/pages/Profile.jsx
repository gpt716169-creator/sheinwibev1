import React, { useState, useEffect } from 'react';

export default function Profile({ user, dbUser }) {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'addresses' | 'referral'
  
  // Data
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Order Details
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Address Modal
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
      id: null,
      type: 'courier', // 'courier' | 'pvz'
      full_name: dbUser?.name || user?.first_name || '',
      phone: dbUser?.phone || '',
      region: '',
      street: '', // Для курьера это улица, для ПВЗ - полный адрес текстом
      is_default: false
  });

  // PVZ Search State
  const [pvzQuery, setPvzQuery] = useState('');
  const [pvzResults, setPvzResults] = useState([]);
  const [selectedPvz, setSelectedPvz] = useState(null);
  const [loadingPvz, setLoadingPvz] = useState(false);

  // Ref Link
  const refLink = `https://t.me/sheinwibe_bot?start=ref_${user?.id}`;

  // --- LOAD DATA ---
  useEffect(() => {
    if (user?.id) {
        loadOrders();
        loadAddresses();
    }
  }, [user]);

  // Debounce PVZ Search
  useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
        if (pvzQuery.length > 2 && !selectedPvz) {
          searchPvz(pvzQuery);
        }
      }, 600);
      return () => clearTimeout(delayDebounceFn);
  }, [pvzQuery]);

  // --- API ---
  const loadOrders = async () => {
      try {
          const res = await fetch(`https://proshein.com/webhook/get-orders?tg_id=${user.id}`);
          const json = await res.json();
          setOrders(json.orders || json.items || []);
      } catch (e) { console.error(e); }
  };

  const loadAddresses = async () => {
      setLoadingData(true);
      try {
          const res = await fetch(`https://proshein.com/webhook/get-addresses?tg_id=${user.id}`);
          const json = await res.json();
          setAddresses(json.addresses || []);
      } catch (e) { console.error(e); }
      finally { setLoadingData(false); }
  };

  const searchPvz = async (query) => {
      setLoadingPvz(true);
      try {
          const res = await fetch(`https://proshein.com/webhook/search-pvz?q=${encodeURIComponent(query)}`);
          const json = await res.json();
          setPvzResults(Array.isArray(json) ? json : []);
      } catch (e) { console.error(e); } 
      finally { setLoadingPvz(false); }
  };

  const handleSaveAddress = async () => {
      // Validation
      if (!addressForm.full_name || !addressForm.phone) {
          window.Telegram?.WebApp?.showAlert("Заполните ФИО и Телефон");
          return;
      }

      let finalStreet = addressForm.street;
      let finalRegion = addressForm.region;

      if (addressForm.type === 'pvz') {
          if (!selectedPvz) {
              window.Telegram?.WebApp?.showAlert("Выберите пункт выдачи 5Post");
              return;
          }
          // Формируем красивую строку для ПВЗ
          finalStreet = `5Post: ${selectedPvz.address} (${selectedPvz.name})`;
          finalRegion = selectedPvz.city;
      } else {
          if (!addressForm.street) {
              window.Telegram?.WebApp?.showAlert("Введите адрес доставки");
              return;
          }
      }

      window.Telegram?.WebApp?.MainButton.showProgress();
      try {
          const res = await fetch('https://proshein.com/webhook/save-address', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  tg_id: user.id,
                  address: {
                      id: addressForm.id,
                      full_name: addressForm.full_name,
                      phone: addressForm.phone,
                      region: finalRegion,
                      street: finalStreet,
                      is_default: addressForm.is_default,
                      email: dbUser?.email || '' // Email сохраняем если есть
                  }
              })
          });
          const json = await res.json();
          if (json.status === 'success') {
              window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
              setIsAddressModalOpen(false);
              loadAddresses(); // Reload list
          }
      } catch (e) {
          window.Telegram?.WebApp?.showAlert("Ошибка сохранения");
      } finally {
          window.Telegram?.WebApp?.MainButton.hideProgress();
      }
  };

  const handleDeleteAddress = async (id, e) => {
      e.stopPropagation();
      if(!window.confirm("Удалить адрес?")) return;
      try {
          await fetch('https://proshein.com/webhook/delete-address', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, tg_id: user.id })
          });
          setAddresses(prev => prev.filter(a => a.id !== id));
      } catch (e) { console.error(e); }
  };

  // --- HANDLERS ---
  const copyRefLink = () => {
      navigator.clipboard.writeText(refLink);
      window.Telegram?.WebApp?.showAlert("Ссылка скопирована!");
  };

  const openNewAddressModal = () => {
      setAddressForm({
          id: null,
          type: 'courier',
          full_name: dbUser?.name || user?.first_name || '',
          phone: dbUser?.phone || '',
          region: '',
          street: '',
          is_default: false
      });
      setSelectedPvz(null);
      setPvzQuery('');
      setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr) => {
      // Определяем тип по содержимому строки адреса
      const isPvz = addr.street.startsWith('5Post');
      setAddressForm({
          id: addr.id,
          type: isPvz ? 'pvz' : 'courier',
          full_name: addr.full_name,
          phone: addr.phone,
          region: addr.region,
          street: addr.street,
          is_default: addr.is_default
      });
      // Если это ПВЗ, мы не можем "восстановить" объект selectedPvz полностью для поиска, 
      // но мы можем показать текущее значение в инпуте.
      if (isPvz) {
          // Вырезаем "5Post: " для отображения
          setSelectedPvz({ address: addr.street.replace('5Post: ', ''), city: addr.region, name: 'Saved' }); 
      }
      setIsAddressModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen pb-24 animate-fade-in overflow-y-auto">
        
        {/* HEADER */}
        <div className="flex flex-col items-center pt-8 pb-6 bg-gradient-to-b from-[#102216] to-transparent shrink-0">
             <div className="w-24 h-24 rounded-full bg-cover bg-center border-4 border-[#102216] shadow-xl relative">
                 <div className="absolute inset-0 rounded-full bg-cover bg-center" style={{backgroundImage: user?.photo_url ? `url('${user.photo_url}')` : 'none', backgroundColor: '#2a3441'}}></div>
                 {!user?.photo_url && <span className="material-symbols-outlined text-white/30 text-4xl absolute inset-0 flex items-center justify-center">person</span>}
             </div>
             <h2 className="text-white text-xl font-bold mt-3">{user?.first_name}</h2>
             <div className="flex gap-2 mt-2">
                 <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-[#cd7f32] border border-white/5">{dbUser?.status || 'Bronze'}</span>
                 <span className="px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary border border-primary/20">{dbUser?.points || 0} WIBE</span>
             </div>
        </div>

        {/* TABS */}
        <div className="px-6 mb-6 shrink-0">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button onClick={() => setActiveTab('orders')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'orders' ? 'bg-white/10 text-white' : 'text-white/40'}`}>Заказы</button>
                <button onClick={() => setActiveTab('addresses')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'addresses' ? 'bg-white/10 text-white' : 'text-white/40'}`}>Адреса</button>
                <button onClick={() => setActiveTab('referral')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'referral' ? 'bg-white/10 text-white' : 'text-white/40'}`}>Друзья</button>
            </div>
        </div>

        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
            <div className="px-6 space-y-3 pb-10">
                {orders.length === 0 ? (
                    <div className="text-center text-white/30 text-sm py-10">Список заказов пуст</div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-dark-card border border-white/5 rounded-xl p-4 cursor-pointer active:scale-95 transition-transform">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-white text-sm">#{order.id.slice(0,8).toUpperCase()}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${order.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}>{order.status}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="flex -space-x-2 pl-2">
                                    {(order.order_items || []).slice(0,3).map((i,x) => (
                                        <div key={x} className="w-8 h-8 rounded-full border border-[#151c28] bg-cover bg-center bg-white/5" style={{backgroundImage: `url('${i.image_url}')`}}></div>
                                    ))}
                                </div>
                                <span className="font-bold text-primary">{order.total_amount?.toLocaleString()} ₽</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* --- ADDRESSES TAB --- */}
        {activeTab === 'addresses' && (
            <div className="px-6 space-y-4 pb-10">
                <button onClick={openNewAddressModal} className="w-full py-3 border border-dashed border-white/20 rounded-xl flex items-center justify-center gap-2 text-primary hover:bg-white/5 transition-colors active:scale-98">
                    <span className="material-symbols-outlined">add_location_alt</span>
                    <span className="font-bold text-sm">Добавить адрес</span>
                </button>

                {loadingData ? (
                     <div className="text-center text-white/30 text-xs py-4">Загрузка...</div>
                ) : addresses.length === 0 ? (
                     <p className="text-center text-white/30 text-xs py-4">Нет сохраненных адресов</p>
                ) : (
                    addresses.map(addr => {
                        const isPvz = addr.street.startsWith('5Post');
                        return (
                            <div key={addr.id} onClick={() => openEditAddressModal(addr)} className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${addr.is_default ? 'bg-primary/5 border-primary/30' : 'bg-dark-card border-white/5'}`}>
                                {addr.is_default && (
                                    <div className="absolute top-3 right-3 text-primary"><span className="material-symbols-outlined text-lg">check_circle</span></div>
                                )}
                                <div className="pr-8">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${isPvz ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {isPvz ? '5Post' : 'Курьер'}
                                        </span>
                                        <h4 className="text-white font-bold text-sm">{addr.full_name}</h4>
                                    </div>
                                    <p className="text-white/80 text-xs leading-snug">
                                        {addr.region ? `${addr.region}, ` : ''}{addr.street}
                                    </p>
                                    <p className="text-white/40 text-[10px] mt-1">{addr.phone}</p>
                                </div>
                                <button onClick={(e) => handleDeleteAddress(addr.id, e)} className="absolute bottom-3 right-3 text-white/20 hover:text-red-400 p-1">
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        )}

        {/* --- REFERRAL TAB --- */}
        {activeTab === 'referral' && (
            <div className="px-6 space-y-4 animate-fade-in">
                <div className="bg-gradient-to-br from-primary via-emerald-600 to-emerald-800 rounded-2xl p-6 text-center relative overflow-hidden shadow-lg shadow-emerald-900/40">
                    <div className="relative z-10">
                        <h3 className="text-[#102216] font-bold text-xl mb-1">Пригласи друга</h3>
                        <p className="text-[#102216]/80 text-sm mb-4 font-medium">Получи 200 WIBE за каждого!</p>
                        <div className="bg-white/90 rounded-xl p-3 flex justify-between items-center gap-2 cursor-pointer shadow-inner" onClick={copyRefLink}>
                            <span className="text-xs text-gray-800 font-mono truncate flex-1">{refLink}</span>
                            <span className="material-symbols-outlined text-gray-600">content_copy</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-[140px] text-white/20 rotate-12">groups</span>
                </div>
            </div>
        )}

        {/* --- MODAL: ADD/EDIT ADDRESS --- */}
        {isAddressModalOpen && (
            <div className="fixed inset-0 z-[60] bg-[#101622] flex flex-col animate-slide-up">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#101622]">
                    <button onClick={() => setIsAddressModalOpen(false)} className="text-white/50 hover:text-white">Отмена</button>
                    <h3 className="text-white font-bold">{addressForm.id ? 'Редактировать' : 'Новый адрес'}</h3>
                    <button onClick={handleSaveAddress} className="text-primary font-bold">Сохранить</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* TYPE SWITCHER */}
                    <div className="flex bg-white/5 p-1 rounded-xl">
                        <button onClick={() => setAddressForm({...addressForm, type: 'courier'})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addressForm.type === 'courier' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                            🏠 Курьер / Почта
                        </button>
                        <button onClick={() => setAddressForm({...addressForm, type: 'pvz'})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addressForm.type === 'pvz' ? 'bg-red-500/20 text-red-400' : 'text-white/40'}`}>
                            📦 ПВЗ 5Post
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">Контактное лицо</label>
                            <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={addressForm.full_name} onChange={e => setAddressForm({...addressForm, full_name: e.target.value})} placeholder="ФИО" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">Телефон</label>
                            <input type="tel" className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} placeholder="+7..." />
                        </div>

                        {/* COURIER FIELDS */}
                        {addressForm.type === 'courier' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">Регион / Город</label>
                                    <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={addressForm.region} onChange={e => setAddressForm({...addressForm, region: e.target.value})} placeholder="г. Москва" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">Улица, Дом, Квартира</label>
                                    <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} placeholder="ул. Ленина, д. 1" />
                                </div>
                            </div>
                        )}

                        {/* PVZ SEARCH */}
                        {addressForm.type === 'pvz' && (
                             <div className="space-y-3 animate-fade-in">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">Поиск пункта выдачи</label>
                                {!selectedPvz ? (
                                     <div className="relative">
                                         <span className="material-symbols-outlined absolute left-3 top-3.5 text-white/40">search</span>
                                         <input 
                                            className="custom-input w-full rounded-xl pl-10 pr-4 py-3 text-sm" 
                                            placeholder="Город, Улица (например: Москва Тверская)"
                                            value={pvzQuery}
                                            onChange={(e) => {
                                                setPvzQuery(e.target.value);
                                                if(e.target.value === '') setPvzResults([]);
                                            }}
                                         />
                                         {loadingPvz && <div className="absolute right-3 top-3.5"><span className="material-symbols-outlined animate-spin text-primary text-sm">progress_activity</span></div>}
                                         
                                         {pvzResults.length > 0 && (
                                             <div className="mt-2 bg-[#1c2636] border border-white/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                                 {pvzResults.map(pvz => (
                                                     <div key={pvz.id} onClick={() => { setSelectedPvz(pvz); setPvzQuery(''); setPvzResults([]); }} className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                                                         <p className="text-white text-xs font-bold">{pvz.city}, {pvz.address}</p>
                                                         <p className="text-white/50 text-[10px]">{pvz.name}</p>
                                                     </div>
                                                 ))}
                                             </div>
                                         )}
                                     </div>
                                 ) : (
                                     <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex justify-between items-center">
                                         <div>
                                             <p className="text-red-400 text-[10px] font-bold uppercase mb-1">Выбран 5Post</p>
                                             <p className="text-white text-sm font-medium leading-snug">{selectedPvz.city || selectedPvz.region}, {selectedPvz.address || selectedPvz.street}</p>
                                         </div>
                                         <button onClick={() => setSelectedPvz(null)} className="text-white/50 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                                     </div>
                                 )}
                             </div>
                        )}
                        
                        <div className="pt-4 flex items-center justify-between">
                            <span className="text-sm text-white">Использовать как основной</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={addressForm.is_default} onChange={e => setAddressForm({...addressForm, is_default: e.target.checked})} />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- ORDER DETAILS MODAL --- */}
        {selectedOrder && (
            <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
                <div className="bg-[#151c28] w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-white font-bold">Заказ #{selectedOrder.id.slice(0,6)}</h3>
                        <button onClick={() => setSelectedOrder(null)} className="text-white/50"><span className="material-symbols-outlined">close</span></button>
                    </div>
                    <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                        <div className="bg-white/5 rounded-xl p-3 space-y-2">
                             <div className="flex justify-between text-xs"><span className="text-white/50">Статус</span><span className="text-white">{selectedOrder.status}</span></div>
                             <div className="flex justify-between text-xs"><span className="text-white/50">Трек-номер</span><span className="text-primary font-mono select-all">{selectedOrder.tracking_number || 'В обработке'}</span></div>
                             <div className="flex justify-between text-xs"><span className="text-white/50">Доставка</span><span className="text-white text-right max-w-[150px]">{selectedOrder.delivery_address}</span></div>
                        </div>
                        <div className="space-y-3">
                            {selectedOrder.order_items?.map((item, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-12 h-16 rounded bg-cover bg-center bg-white/5" style={{backgroundImage: `url('${item.image_url}')`}}></div>
                                    <div>
                                        <p className="text-white text-xs line-clamp-2">{item.product_name}</p>
                                        <p className="text-white/50 text-[10px]">{item.size} / {item.color}</p>
                                        <p className="text-white font-bold text-xs mt-1">{item.final_price_rub} ₽</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
