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
  
  // ВАЖНО: Теперь activeCoupon это объект, а не строка
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
  const MIN_ORDER_AMOUNT = 3000; // --- НОВАЯ КОНСТАНТА: Мин. заказ ---
  const userPointsBalance = dbUser?.points || 0;

  // --- LOAD DATA ---
  useEffect(() => {
    if (user?.id) { 
        loadCart(); 
        loadAddresses(); 
    } else {
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

  const handleUpdateQuantity = async (id, delta) => {
      const currentItem = items.find(i => i.id === id);
      if (!currentItem) return;

      const newQty = Math.max(1, currentItem.quantity + delta);
      if (newQty === currentItem.quantity) return;

      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));

      try {
          await fetch('https://proshein.com/webhook/update-cart-item', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  id, 
                  quantity: newQty,
                  size: currentItem.size, 
                  color: currentItem.color,
                  tg_id: user?.id 
              })
          });
      } catch (e) {
          console.error("Ошибка сохранения количества:", e);
      }
  };

  const saveItemParams = async (id, newSize, newColor) => {
    setSavingItem(true);
    const currentItem = items.find(i => i.id === id);
    const quantity = currentItem ? currentItem.quantity : 1;
    const colorToSave = newColor || (currentItem ? currentItem.color : '');

    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, size: newSize, color: colorToSave } 
        : item
    ));

    try {
      const res = await fetch('https://proshein.com/webhook/update-cart-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: id,
          tg_id: user?.id,
          quantity: quantity,
          size: newSize,
          color: colorToSave
        })
      });
      if (!res.ok) throw new Error('Failed to update');
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
      setEditingItem(null); 
    } catch (e) {
      console.error('Ошибка сохранения параметров:', e);
      window.Telegram?.WebApp?.showAlert('Не удалось сохранить изменения');
    } finally {
      setSavingItem(false);
    }
  };
   
  const handleDeleteItem = async (e, id) => {
      if(!window.confirm('Удалить товар из корзины?')) return;
      setItems(prev => prev.filter(i => i.id !== id));
      try {
          await fetch('https://proshein.com/webhook/delete-item', { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ id, tg_id: user?.id }) 
          });
      } catch (e) { console.error(e); }
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

  // --- ЛОГИКА КУПОНОВ ---
  const applyCoupon = (coupon) => {
      if (!coupon) {
          setActiveCoupon(null);
          setCouponDiscount(0);
          return;
      }

      if (subtotal < (coupon.min_order_amount || 0)) {
          window.Telegram?.WebApp?.showAlert(`Мин. сумма заказа для этого купона: ${coupon.min_order_amount}₽`);
          return;
      }

      let discount = 0;
      if (coupon.type === 'percent') {
          discount = Math.floor(subtotal * (coupon.discount_amount / 100));
      } else {
          discount = Number(coupon.discount_amount);
      }

      if (discount > subtotal) discount = subtotal;

      setCouponDiscount(discount);
      setActiveCoupon(coupon); 
      setShowCouponModal(false);
      window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
  };

  const pointsUsed = parseInt(pointsInput) || 0;
  const finalTotal = Math.max(0, subtotal - couponDiscount - pointsUsed);

  // --- НОВАЯ ЛОГИКА: РАСЧЕТ ЦЕН ДЛЯ ВЫКУПА (ДЛЯ ЧЕКА) ---
  // Мы создаем отдельный список товаров, где рассчитываем цену с учетом скидок
  const itemsForCheckout = useMemo(() => {
      const totalDiscountValue = couponDiscount + pointsUsed;
      
      // Если скидок нет, просто добавляем поле price_at_purchase равное текущей цене
      if (totalDiscountValue <= 0) {
          return items.map(item => ({
              ...item,
              price_at_purchase: item.final_price_rub
          }));
      }

      // Если скидка есть, распределяем её пропорционально
      let distributedDiscount = 0;
      
      return items.map((item, index) => {
          // Стоимость позиции (цена * кол-во)
          const itemTotalOriginal = item.final_price_rub * item.quantity;
          
          // Доля товара в общей сумме
          // Формула: (ЦенаПозиции / ОбщуюСумму) * ОбщаяСкидка
          let itemDiscount = Math.floor((itemTotalOriginal / subtotal) * totalDiscountValue);
          
          // Корректировка копеек на последнем товаре, чтобы сумма сходилась
          if (index === items.length - 1) {
              itemDiscount = totalDiscountValue - distributedDiscount;
          } else {
              distributedDiscount += itemDiscount;
          }

          // Итоговая стоимость позиции со скидкой
          const totalDiscountedPrice = itemTotalOriginal - itemDiscount;
          
          // Цена за 1 штуку (для базы данных)
          const unitPrice = Math.floor(totalDiscountedPrice / item.quantity);

          return {
              ...item,
              price_at_purchase: unitPrice // <--- Эту цену мы будем сохранять в базу
          };
      });
  }, [items, subtotal, couponDiscount, pointsUsed]);


  const openCheckout = () => {
      // 1. Проверка размеров
      if (items.some(i => i.size === 'NOT_SELECTED' || !i.size)) {
          window.Telegram?.WebApp?.showAlert('Сначала выберите размер для всех товаров!');
          return;
      }

      // 2. Проверка минимальной суммы (НОВОЕ)
      if (subtotal < MIN_ORDER_AMOUNT) {
          window.Telegram?.WebApp?.showAlert(`Минимальная сумма заказа: ${MIN_ORDER_AMOUNT.toLocaleString()} ₽`);
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
                  subtotal={subtotal} 
                  total={finalTotal} 
                  discount={couponDiscount}
                  pointsInput={pointsInput} 
                  setPointsInput={handlePointsChange}
                  userPointsBalance={userPointsBalance} 
                  handleUseMaxPoints={() => handlePointsChange(userPointsBalance)}
                  activeCouponCode={activeCoupon?.code}
                  onOpenCoupons={() => setShowCouponModal(true)}
                  onPay={openCheckout} 
                  onPlayVideo={() => setVideoOpen(true)} 
              />
          </div>
      )}

      {/* --- MODALS --- */}
      {editingItem && (
        <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} onSave={saveItemParams} saving={savingItem} />
      )}

      {showCouponModal && (
         <CouponModal 
            userId={user?.id}
            subtotal={subtotal}
            onClose={() => setShowCouponModal(false)}
            onApply={applyCoupon}
            activeCouponCode={activeCoupon?.code}
         />
      )}

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
           total={finalTotal} 
           items={itemsForCheckout} // <--- ПЕРЕДАЕМ ТОВАРЫ С РАССЧИТАННЫМИ ЦЕНАМИ ВЫКУПА
           pointsUsed={pointsUsed} 
           couponDiscount={couponDiscount} activeCoupon={activeCoupon}
           addresses={addresses} deliveryMethod={deliveryMethod} setDeliveryMethod={setDeliveryMethod}
           selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress}
           selectedPvz={selectedPvz} setSelectedPvz={setSelectedPvz}
           onManageAddresses={handleManageAddresses} 
        />
      )}

      {videoOpen && <FullScreenVideo src={VIDEO_URL} onClose={() => setVideoOpen(false)} />}
    </div>
  );
}
