import React, { useState, useEffect } from 'react';
import ProfileHeader from '../components/profile/ProfileHeader';
import OrdersTab from '../components/profile/OrdersTab';
import AddressesTab from '../components/profile/AddressesTab';
import ReferralTab from '../components/profile/ReferralTab';
import OrderDetailsModal from '../components/profile/OrderDetailsModal';
import AddressModal from '../components/profile/AddressModal';

// Ссылка формируется автоматически от текущего домена
const OFFER_LINK = window.location.origin + '/offer.pdf';

export default function Profile({ user, dbUser }) {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('orders'); 
  
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // --- НОВАЯ ЛОГИКА: ПЕРЕХОД ИЗ КОРЗИНЫ ---
  useEffect(() => {
    const redirectTab = sessionStorage.getItem('open_profile_tab');
    if (redirectTab === 'addresses') {
        setActiveTab('addresses');
        sessionStorage.removeItem('open_profile_tab'); // Очищаем флаг
    }
  }, []);
  // ----------------------------------------

  // --- LOAD DATA ---
  useEffect(() => {
    if (user?.id) {
        loadOrders();
        loadAddresses();
    }
  }, [user]);

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

  // --- HANDLERS ---
  const handleSaveAddress = async (addressData) => {
      window.Telegram?.WebApp?.MainButton.showProgress();
      try {
          const res = await fetch('https://proshein.com/webhook/save-address', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  tg_id: user.id,
                  address: addressData 
              })
          });
          const json = await res.json();
          if (json.status === 'success') {
              window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
              setIsAddressModalOpen(false);
              setEditingAddress(null);
              loadAddresses(); 
          } else {
              window.Telegram?.WebApp?.showAlert("Ошибка: " + json.message);
          }
      } catch (e) {
          window.Telegram?.WebApp?.showAlert("Ошибка сохранения");
      } finally {
          window.Telegram?.WebApp?.MainButton.hideProgress();
      }
  };

  const handleDeleteAddress = async (addressId, e) => {
      e.stopPropagation();
      if(!window.confirm("Вы точно хотите удалить этот адрес?")) return;
      
      const newAddresses = addresses.filter(a => a.id !== addressId);
      setAddresses(newAddresses);

      try {
          await fetch('https://proshein.com/webhook/delete-address', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: addressId, tg_id: user.id })
          });
      } catch (e) { 
          console.error("Delete error:", e);
          loadAddresses();
      }
  };

  const openNewAddress = () => {
      setEditingAddress(null);
      setIsAddressModalOpen(true);
  };

  const openEditAddress = (addr) => {
      setEditingAddress(addr);
      setIsAddressModalOpen(true);
  };

  // --- ФУНКЦИЯ ОТКРЫТИЯ ОФЕРТЫ ---
  const openOffer = () => {
    // Используем нативный метод Telegram для открытия ссылок во внешнем браузере
    if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(OFFER_LINK, { try_instant_view: false });
    } else {
        window.open(OFFER_LINK, '_blank');
    }
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col h-screen pb-24 animate-fade-in overflow-y-auto">
        
        {/* HEADER */}
        <ProfileHeader user={user} dbUser={dbUser} />

        {/* TABS */}
        <div className="px-6 mb-6 shrink-0">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button onClick={() => setActiveTab('orders')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'orders' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}>Заказы</button>
                <button onClick={() => setActiveTab('addresses')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'addresses' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}>Адреса</button>
                <button onClick={() => setActiveTab('referral')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'referral' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}>Друзья</button>
            </div>
        </div>

        {/* CONTENT (С flex-1, чтобы толкать футер вниз) */}
        <div className="flex-1">
            {activeTab === 'orders' && (
                <OrdersTab orders={orders} onSelectOrder={setSelectedOrder} />
            )}

            {activeTab === 'addresses' && (
                <AddressesTab 
                    addresses={addresses} 
                    loading={loadingData} 
                    onAdd={openNewAddress} 
                    onEdit={openEditAddress} 
                    onDelete={handleDeleteAddress} 
                />
            )}

            {activeTab === 'referral' && (
                <ReferralTab userId={user?.id} />
            )}
        </div>

        {/* --- FOOTER: ОФЕРТА --- */}
        <div className="p-6 mt-4 flex flex-col items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
            <button 
                onClick={openOffer}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
                <span className="material-symbols-outlined text-lg">description</span>
                Договор оферты
            </button>
            <div className="text-[9px] text-white/20 mt-2">
                SHEINWIBE © 2025
            </div>
        </div>

        {/* MODALS */}
        <OrderDetailsModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
        />
        
        <AddressModal 
            isOpen={isAddressModalOpen} 
            onClose={() => setIsAddressModalOpen(false)} 
            editingAddress={editingAddress} 
            user={user} 
            onSave={handleSaveAddress} 
        />
    </div>
  );
}
