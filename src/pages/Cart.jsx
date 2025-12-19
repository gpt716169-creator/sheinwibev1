import React, { useState, useEffect, useMemo } from 'react';
import CartItem from '../components/cart/CartItem';
import PaymentBlock from '../components/cart/PaymentBlock';
import FullScreenVideo from '../components/ui/FullScreenVideo';
import EditItemModal from '../components/cart/EditItemModal';
import CheckoutModal from '../components/cart/CheckoutModal';
import CouponModal from '../components/cart/CouponModal';

export default function Cart({ user, dbUser, setActiveTab, onRefreshData }) {
  // --- STATE: DATA ---
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE: ADDRESS & DELIVERY ---
  const [addresses, setAddresses] = useState([]);
  const [deliveryMethod, setDeliveryMethod] = useState('ПВЗ (5Post)');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPvz, setSelectedPvz] = useState(null);

  // --- STATE: DISCOUNTS ---
  const [pointsInput, setPointsInput] = useState('');
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
    // Если юзер есть — грузим данные
    if (user?.id) { 
        loadCart(); 
        loadAddresses(); 
    } else {
        // Если юзера нет, останавливаем загрузку через секунду (чтобы не висело вечно)
        const t = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(t);
    }
  }, [user]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://proshein.com/webhook/get-cart?tg_id=${user?.id}`);
      if (!res.ok) throw new Error('Ошибка сети');
      const json = await res.json();
      setItems((json.items || []).map(i => ({ ...i, quantity: i.quantity || 1 })));
    } catch (e) { 
        console.error("Ошибка загрузки корзины:", e); 
    } finally { 
        setLoading(false); 
    }
  };

  const loadAddresses = async () => {
      try {
          const res = await fetch(`https://proshein.com/webhook/get-addresses?tg_id=${user?.id}`);
          const json = await res.json();
          setAddresses(json.addresses || []);
      } catch (e) { console.error("Ошибка загрузки адресов:", e); }
  };

  // --- ACTIONS ---

  const handleManageAddresses = () => {
      sessionStorage.setItem('open_profile_tab', 'addresses');
      setActiveTab('profile');
  };

  // ОБНОВЛЕННАЯ ФУНКЦИЯ ИЗМЕНЕНИЯ КОЛИЧЕСТВА
  const handleUpdateQuantity = async (id, delta) => {
      // 1. Ищем товар в текущем списке
      const currentItem = items.find(i => i.id === id);
      if (!currentItem) return;

      // 2. Считаем новое количество (не меньше 1)
      const newQty = Math.max(1, currentItem.quantity + delta);
      if (newQty === currentItem.quantity) return; // Если не изменилось, выходим

      // 3. Мгновенно обновляем экран (чтобы не тупило)
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));

      // 4. Тихо отправляем данные на сервер
      try {
          await fetch('https://proshein.com/webhook/update-cart-item', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  id, 
                  quantity: newQty,
                  // Важно: отправляем текущие размер и цвет, чтобы n8n их не стер
                  size: currentItem.size, 
                  color: currentItem.color,
                  tg_id: user?.id 
              })
          });
      } catch (e) {
          console.error("Ошибка сохранения количества:", e);
      }
  };
  
  const handleDeleteItem = async (e, id) => {
      if(!window.confirm('Удалить товар?')) return;
      setItems(prev => prev.filter(i => i.id !== id));
      try {
          await fetch('https://proshein.com/webhook/delete-item', { method: 'POST', body: JSON.stringify({ id, tg_id: user?.id }) });
      } catch (e) { console.error(e); }
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

  const applyCoupon = (codeFromModal) => {
      const code = (codeFromModal || '').toUpperCase().trim();
      if (!code) return;
      
      let discount = 0;
      if (code === 'WELCOME') discount = 500;
      else if (code === 'SALE10') discount = Math.floor(subtotal * 0.1);
      else { 
          window.Telegram?.WebApp?.showAlert('Неверный код или купон истек'); 
          return; 
      }

      setCouponDiscount(discount);
      setActiveCoupon(code);
      setShowCouponModal(false);
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
      window.Telegram?.WebApp?.showAlert(`Купон ${code} применен! Скидка: ${discount} ₽`);
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

      {loading ? (
          <div className="text-center text-white/50 mt-10">Загрузка...</div>
      ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-10 opacity-50">
             <span className="material-symbols-outlined text-4xl mb-2">shopping_basket</span>
             <p className="text-sm">Корзина пуста</p>
          </div>
      ) : (
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

      {/* 1. Редактирование */}
      {editingItem && (
        <EditItemModal 
          item={editingItem} onClose={() => setEditingItem(null)} 
          onSave={saveItemParams} saving={savingItem} 
        />
      )}

      {/* 2. Купоны */}
      {showCouponModal && (
         <CouponModal 
            onClose={() => setShowCouponModal(false)}
            onApply={applyCoupon}
            activeCoupon={activeCoupon}
         />
      )}

      {/* 3. Оформление заказа */}
      {showCheckout && (
        <CheckoutModal 
           onClose={(success) => { 
               setShowCheckout(false); 
               if(success) { 
                   setItems([]); 
                   if (onRefreshData) onRefreshData(); 
                   setActiveTab('home'); 
               } 
           }}
           user={user} dbUser={dbUser}
           total={finalTotal} items={items} pointsUsed={pointsUsed} couponDiscount={couponDiscount} activeCoupon={activeCoupon}
           addresses={addresses} deliveryMethod={deliveryMethod} setDeliveryMethod={setDeliveryMethod}
           selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress}
           selectedPvz={selectedPvz} setSelectedPvz={setSelectedPvz}
           onManageAddresses={handleManageAddresses} 
        />
      )}

      {/* 4. Видео */}
      {videoOpen && <FullScreenVideo src={VIDEO_URL} onClose={() => setVideoOpen(false)} />}
    </div>
  );
}
