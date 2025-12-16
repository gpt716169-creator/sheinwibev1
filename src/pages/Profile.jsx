import React, { useState, useEffect } from 'react';

export default function Profile({ user, dbUser }) {
  // --- Состояния ---
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'addresses'
  
  // Заказы
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Адреса
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  // Форма адреса
  const initialAddressState = {
      id: null,
      full_name: dbUser?.name || user?.first_name || '',
      phone: dbUser?.phone || '',
      email: dbUser?.email || '',
      region: '',
      street: '',
      is_default: false
  };
  const [addressForm, setAddressForm] = useState(initialAddressState);

  // --- Загрузка данных ---
  useEffect(() => {
    if (user?.id) {
        loadOrders();
        loadAddresses();
    }
  }, [user]);

  // --- API Functions ---
  
  const loadOrders = async () => {
      setLoadingOrders(true);
      try {
          const res = await fetch(`https://proshein.com/webhook/get-orders?tg_id=${user.id}`);
          const json = await res.json();
          const list = json.orders || json.items || (Array.isArray(json) ? json : []);
          setOrders(list);
      } catch (e) {
          console.error("Orders load error:", e);
      } finally {
          setLoadingOrders(false);
      }
  };

  const loadAddresses = async () => {
      setLoadingAddresses(true);
      try {
          const res = await fetch(`https://proshein.com/webhook/get-addresses?tg_id=${user.id}`);
          const json = await res.json();
          // Ожидаем массив адресов
          setAddresses(Array.isArray(json) ? json : (json.addresses || []));
      } catch (e) {
          console.error("Addresses load error:", e);
      } finally {
          setLoadingAddresses(false);
      }
  };

  const handleSaveAddress = async () => {
      // Валидация
      if (!addressForm.full_name || !addressForm.phone || !addressForm.street) {
          window.Telegram?.WebApp?.showAlert("Заполните обязательные поля: ФИО, Телефон, Адрес");
          return;
      }

      window.Telegram?.WebApp?.MainButton.showProgress();
      try {
          const res = await fetch('https://proshein.com/webhook/save-address', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  tg_id: user.id,
                  address: addressForm
              })
          });
          const json = await res.json();
          
          if (json.status === 'success') {
              window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
              setIsAddressModalOpen(false);
              loadAddresses(); // Перезагружаем список
          } else {
              alert("Ошибка сохранения");
          }
      } catch (e) {
          console.error(e);
          window.Telegram?.WebApp?.showAlert("Ошибка сети");
      } finally {
          window.Telegram?.WebApp?.MainButton.hideProgress();
      }
  };

  const handleDeleteAddress = async (id, e) => {
      e.stopPropagation();
      if(!window.confirm("Удалить этот адрес?")) return;

      try {
          await fetch('https://proshein.com/webhook/delete-address', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, tg_id: user.id })
          });
          setAddresses(prev => prev.filter(a => a.id !== id));
      } catch (e) {
          console.error(e);
      }
  };

  const openEditAddress = (addr) => {
      setAddressForm({
          id: addr.id,
          full_name: addr.full_name,
          phone: addr.phone,
          email: addr.email || '',
          region: addr.region || '',
          street: addr.street,
          is_default: addr.is_default
      });
      setIsAddressModalOpen(true);
  };

  const openNewAddress = () => {
      setAddressForm(initialAddressState);
      setIsAddressModalOpen(true);
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col h-screen pb-24 animate-fade-in overflow-y-auto">
        
        {/* Profile Card */}
        <div className="flex flex-col items-center pt-8 pb-6 relative z-10 bg-gradient-to-b from-[#102216] to-transparent">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-600 rounded-full opacity-75 blur"></div>
                <div className="relative bg-center bg-no-repeat bg-cover rounded-full h-24 w-24 ring-4 ring-[#102216] flex items-center justify-center bg-[#102216]" 
                     style={{backgroundImage: user?.photo_url ? `url('${user.photo_url}')` : 'none'}}>
                     {!user?.photo_url && <span className="material-symbols-outlined text-white/30 text-4xl">person</span>}
                </div>
            </div>
            <h2 className="text-white text-xl font-bold mt-4">{user?.first_name || 'Гость'}</h2>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/5 mt-2">
                <span className="material-symbols-outlined text-[#cd7f32] text-[16px]">star</span>
                <p className="text-[#cd7f32] text-xs font-bold uppercase tracking-wider">{dbUser?.status || 'Bronze'}</p>
            </div>
        </div>

        {/* Tabs */}
        <div className="px-6 mb-6">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button 
                    onClick={() => setActiveTab('orders')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'orders' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}
                >
                    Мои заказы
                </button>
                <button 
                    onClick={() => setActiveTab('addresses')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'addresses' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}
                >
                    Адреса
                </button>
            </div>
        </div>

        {/* --- TAB CONTENT: ORDERS --- */}
        {activeTab === 'orders' && (
            <div className="px-6 space-y-3">
                {loadingOrders ? (
                    <div className="text-center text-white/30 py-10">Загрузка заказов...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center text-white/30 py-10 flex flex-col items-center">
                        <span className="material-symbols-outlined text-4xl mb-2">list_alt</span>
                        <p>История заказов пуста</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-dark-card border border-white/5 rounded-xl p-4 active:scale-[0.98] transition-transform cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-white font-bold text-sm">Заказ #{order.id.slice(0,8).toUpperCase()}</p>
                                    <p className="text-white/40 text-[10px]">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="flex -space-x-2">
                                    {(order.order_items || []).slice(0,3).map((item, idx) => (
                                        <div key={idx} className="w-8 h-8 rounded-full border border-[#151c28] bg-white/5 bg-cover bg-center" style={{backgroundImage: `url('${item.image_url}')`}}></div>
                                    ))}
                                    {(order.order_items || []).length > 3 && (
                                        <div className="w-8 h-8 rounded-full border border-[#151c28] bg-[#2a3441] flex items-center justify-center text-[9px] text-white font-bold">
                                            +{(order.order_items?.length || 0) - 3}
                                        </div>
                                    )}
                                </div>
                                <span className="text-white font-bold">{order.total_amount?.toLocaleString()} ₽</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* --- TAB CONTENT: ADDRESSES --- */}
        {activeTab === 'addresses' && (
            <div className="px-6 space-y-4">
                <button onClick={openNewAddress} className="w-full py-4 border border-dashed border-white/20 rounded-xl flex items-center justify-center gap-2 text-primary hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined">add_location_alt</span>
                    <span className="font-bold text-sm">Добавить новый адрес</span>
                </button>

                {loadingAddresses ? (
                    <div className="text-center text-white/30">Загрузка адресов...</div>
                ) : addresses.length === 0 ? (
                    <p className="text-center text-white/30 text-xs">Нет сохраненных адресов</p>
                ) : (
                    addresses.map(addr => (
                        <div key={addr.id} onClick={() => openEditAddress(addr)} className={`relative p-4 rounded-xl border transition-all cursor-pointer ${addr.is_default ? 'bg-primary/5 border-primary/30' : 'bg-dark-card border-white/5'}`}>
                            {addr.is_default && (
                                <div className="absolute top-3 right-3 flex items-center gap-1 text-primary text-[10px] font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-sm">check_circle</span> Основной
                                </div>
                            )}
                            <div className="pr-16">
                                <h4 className="text-white font-bold text-sm mb-0.5">{addr.full_name}</h4>
                                <p className="text-white/60 text-xs">{addr.phone}</p>
                                <p className="text-white/80 text-sm mt-2 leading-snug">
                                    {addr.region ? `${addr.region}, ` : ''}{addr.street}
                                </p>
                            </div>
                            <button 
                                onClick={(e) => handleDeleteAddress(addr.id, e)}
                                className="absolute bottom-3 right-3 p-2 text-white/20 hover:text-red-400 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* --- MODAL: EDIT/ADD ADDRESS --- */}
        {isAddressModalOpen && (
            <div className="fixed inset-0 z-50 bg-[#101622] flex flex-col animate-slide-up">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#101622]">
                    <button onClick={() => setIsAddressModalOpen(false)} className="text-white/50 hover:text-white">Отмена</button>
                    <h3 className="text-white font-bold">{addressForm.id ? 'Редактирование' : 'Новый адрес'}</h3>
                    <button onClick={handleSaveAddress} className="text-primary font-bold">Сохранить</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div className="space-y-1.5">
                         <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">ФИО Получателя *</label>
                         <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={addressForm.full_name} onChange={e => setAddressForm({...addressForm, full_name: e.target.value})} placeholder="Иванов Иван Иванович" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                             <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">Телефон *</label>
                             <input type="tel" className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} placeholder="+7 999..." />
                        </div>
                        <div className="space-y-1.5">
                             <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">Email</label>
                             <input type="email" className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={addressForm.email} onChange={e => setAddressForm({...addressForm, email: e.target.value})} placeholder="email@..." />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                         <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">Регион / Область</label>
                         <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={addressForm.region} onChange={e => setAddressForm({...addressForm, region: e.target.value})} placeholder="Московская обл." />
                    </div>

                    <div className="space-y-1.5">
                         <label className="text-[11px] font-bold uppercase tracking-wider text-white/50 ml-1">Улица, Дом, Кв *</label>
                         <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} placeholder="ул. Ленина, д. 1, кв. 10" />
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                        <span className="text-sm text-white">Сделать основным адресом</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={addressForm.is_default} onChange={e => setAddressForm({...addressForm, is_default: e.target.checked})} />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL: ORDER DETAILS --- */}
        {selectedOrder && (
             <div className="fixed inset-0 z-50 bg-[#101622]/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
                 <div className="bg-[#151c28] w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-white font-bold">Детали заказа</h3>
                        <button onClick={() => setSelectedOrder(null)} className="text-white/50 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                    </div>
                    <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                        {selectedOrder.order_items?.map((item, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="w-12 h-16 bg-white/5 rounded bg-cover bg-center" style={{backgroundImage: `url('${item.image_url}')`}}></div>
                                <div>
                                    <p className="text-white text-xs line-clamp-2">{item.product_name}</p>
                                    <p className="text-white/50 text-[10px] mt-1">{item.size} / {item.color}</p>
                                    <p className="text-primary text-xs font-bold mt-1">{item.final_price_rub} ₽</p>
                                </div>
                            </div>
                        ))}
                        <div className="h-px bg-white/5 my-2"></div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Адрес доставки</span>
                            <span className="text-white text-right text-xs max-w-[150px]">{selectedOrder.delivery_address}</span>
                        </div>
                    </div>
                 </div>
             </div>
        )}
    </div>
  );
}
