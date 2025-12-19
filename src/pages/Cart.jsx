import React, { useState, useEffect, useMemo } from 'react';
import CartItem from '../components/cart/CartItem';
import PaymentBlock from '../components/cart/PaymentBlock';
import FullScreenVideo from '../components/ui/FullScreenVideo';
import EditItemModal from '../components/cart/EditItemModal';
import CheckoutModal from '../components/cart/CheckoutModal';
// Добавь onRefreshData в аргументы
export default function Cart({ user, dbUser, setActiveTab, onRefreshData }) {
  // --- STATE: DATA ---
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE: ADDRESS & DELIVERY ---
  // Храним адреса здесь, чтобы они не исчезали при закрытии модалки
  const [addresses, setAddresses] = useState([]);
  const [deliveryMethod, setDeliveryMethod] = useState('ПВЗ (5Post)');
  
  // Выбранные пункты
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPvz, setSelectedPvz] = useState(null);

  // --- STATE: DISCOUNTS ---
  const [pointsInput, setPointsInput] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [activeCoupon, setActiveCoupon] = useState(null); 
  const [couponDiscount, setCouponDiscount] = useState(0);

  // --- STATE: UI ---
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [savingItem, setSavingItem] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  // CONSTANTS
  const VIDEO_URL = "https://storage.yandexcloud.net/videosheinwibe/vkclips_20251219083418.mp4"; 
  const MAX_POINTS_PERCENT = 0.35;
  const userPointsBalance = dbUser?.points || 0;

  // --- LOAD DATA ---
  useEffect(() => {
    if (user?.id) { 
        loadCart(); 
        loadAddresses(); 
    }
  }, [user]);

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

  // --- ACTIONS ---

  // Переход к управлению адресами
  const handleManageAddresses = () => {
      // Сохраняем флаг, чтобы Профиль знал, что надо открыть вкладку адресов
      sessionStorage.setItem('open_profile_tab', 'addresses');
      setActiveTab('profile');
  };

  const handleUpdateQuantity = (id, delta) => setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  
  const handleDeleteItem = async (e, id) => {
      if(!window.confirm('Удалить?')) return;
      setItems(prev => prev.filter(i => i.id !== id));
      await fetch('https://proshein.com/webhook/delete-item', { method: 'POST', body: JSON.stringify({ id, tg_id: user?.id }) });
  };

  const saveItemParams = async (id, size, color) => {
      setSavingItem(true);
      setItems(prev => prev.map(i => i.id === id ? { ...i, size, color } : i));
      try {
          await fetch('https://proshein.com/webhook/update-cart-item', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, size, color, tg_id: user?.id })
          });
      } catch (e) { console.error(e); } 
      finally { setSavingItem(false); setEditingItem(null); }
  };

  // --- CALCULATIONS ---
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (i.final_price_rub * i.quantity), 0), [items]);
  const maxAllowedPoints = Math.floor(subtotal * MAX_POINTS_PERCENT);
  const availablePointsLimit = Math.min(maxAllowedPoints, userPointsBalance);

  const handlePointsChange = (val) => {
      let num = parseInt(val) || 0;
      if (num < 0) num = 0;
      if (num > availablePointsLimit) num = availablePointsLimit;
      setPointsInput(num > 0 ? num.toString() : '');
  };

  const applyCoupon = () => {
      const code = couponInput.toUpperCase().trim();
      if (!code) return;
      
      let discount = 0;
      if (code === 'WELCOME') discount = 500;
      else if (code === 'SALE10') discount = Math.floor(subtotal * 0.1);
      else { window.Telegram?.WebApp?.showAlert('Неверный код'); return; }

      setCouponDiscount(discount);
      setActiveCoupon(code);
      setShowCouponModal(false);
      window.Telegram?.WebApp?.showAlert(`Промокод ${code} применен!`);
  };

  const pointsUsed = parseInt(pointsInput) || 0;
  const finalTotal = Math.max(0, subtotal - couponDiscount - pointsUsed);

  const openCheckout = () => {
      if (items.some(i => i.size === 'NOT_SELECTED' || !i.size)) {
          window.Telegram?.WebApp?.showAlert('Сначала выберите размер для всех товаров!');
          return;
      }
      setShowCheckout(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent animate-fade-in pb-32">
      <div className="p-6 pt-8 pb-4"><h1 className="text-white text-lg font-medium">Корзина ({items.length})</h1></div>

      {loading ? <div className="text-center text-white/50 mt-10">Загрузка...</div> : 
       items.length === 0 ? <div className="text-center text-white/50 mt-10">Пусто</div> : (
          <div className="px-6 space-y-4">
              <div className="space-y-3">
                  {items.map(item => (
                      <CartItem key={item.id} item={item} onEdit={setEditingItem} onDelete={handleDeleteItem} onUpdateQuantity={handleUpdateQuantity} />
                  ))}
              </div>
              <div className="h-px bg-white/5 my-4"></div>
              <PaymentBlock 
                  subtotal={subtotal} total={finalTotal} discount={couponDiscount}
                  pointsInput={pointsInput} setPointsInput={handlePointsChange}
                  userPointsBalance={userPointsBalance} handleUseMaxPoints={() => handlePointsChange(userPointsBalance)}
                  onOpenCoupons={() => setShowCouponModal(true)}
                  onPay={openCheckout} onPlayVideo={() => setVideoOpen(true)} 
              />
          </div>
      )}

      {/* --- MODALS --- */}

      {editingItem && (
        <EditItemModal 
          item={editingItem} onClose={() => setEditingItem(null)} 
          onSave={saveItemParams} saving={savingItem} 
        />
      )}

      {showCouponModal && (
         <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setShowCouponModal(false)}>
            <div className="bg-[#1c2636] w-full max-w-sm rounded-2xl p-6 border border-white/10" onClick={e => e.stopPropagation()}>
                <h3 className="text-white font-bold text-center mb-4">Промокод</h3>
                <input value={couponInput} onChange={e => setCouponInput(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-center uppercase mb-4 focus:border-primary outline-none" placeholder="CODE" />
                <button onClick={applyCoupon} className="w-full bg-primary text-black font-bold py-3 rounded-xl">Применить</button>
            </div>
         </div>
      )}

      {showCheckout && (
        <CheckoutModal 
           onClose={(success) => { setShowCheckout(false); if(success) { setItems([]); setActiveTab('home'); } }}
           user={user} dbUser={dbUser}
           total={finalTotal} items={items} pointsUsed={pointsUsed} couponDiscount={couponDiscount} activeCoupon={activeCoupon}
           // Адреса
           addresses={addresses} deliveryMethod={deliveryMethod} setDeliveryMethod={setDeliveryMethod}
           selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress}
           selectedPvz={selectedPvz} setSelectedPvz={setSelectedPvz}
           // Переход в профиль -> адреса
           onManageAddresses={handleManageAddresses} 
        />
      )}

      {videoOpen && <FullScreenVideo src={VIDEO_URL} onClose={() => setVideoOpen(false)} />}
    </div>
  );
}
