import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AddressBlock from './AddressBlock';

export default function CheckoutModal({ 
  onClose, user, dbUser, total, items, pointsUsed, couponDiscount, activeCoupon,
  // Пропсы для AddressBlock
  addresses, deliveryMethod, setDeliveryMethod,
  selectedAddress, setSelectedAddress,
  pvzQuery, setPvzQuery, pvzResults,
  selectedPvz, setSelectedPvz, loadingPvz,
  onOpenProfile
}) {

  // Инициализируем форму пустыми значениями
  // (Данные подставятся сами, когда юзер кликнет на сохраненный адрес в AddressBlock)
  const [form, setForm] = useState({ name: '', phone: '', email: '', agreed: false, customsAgreed: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = 'auto';
  }, []);

  // Функция, которая принимает данные из AddressBlock при клике на сохраненный адрес
  const handleAddressSelect = (addr) => {
      if (addr) {
          setForm(prev => ({
              ...prev,
              name: addr.full_name || prev.name,
              phone: addr.phone || prev.phone,
              email: addr.email || prev.email
          }));
      }
  };

  const handlePay = async () => {
     // 1. Валидация контактов
     if (!form.name || form.name.length < 2) { 
         window.Telegram?.WebApp?.showAlert('Введите ФИО получателя'); return; 
     }
     if (!form.phone || form.phone.length < 5) { 
         window.Telegram?.WebApp?.showAlert('Введите номер телефона'); return; 
     }
     if (!form.agreed || !form.customsAgreed) {
         window.Telegram?.WebApp?.showAlert('Примите условия оферты и таможни'); return;
     }

     // 2. Сбор адреса
     let finalAddress = '';
     let pickupInfo = null;

     if (deliveryMethod === 'ПВЗ (5Post)') {
         // ЛОГИКА ИЗМЕНЕНА:
         // Если выбран сохраненный пункт (selectedPvz) - берем его.
         // Если нет, берем то, что юзер написал руками в поле (pvzQuery).
         if (selectedPvz) {
             finalAddress = `5Post: ${selectedPvz.city}, ${selectedPvz.address} (${selectedPvz.name})`;
             pickupInfo = { id: selectedPvz.id, postal_code: selectedPvz.postal_code };
         } else if (pvzQuery && pvzQuery.length > 5) {
             // Ручной ввод
             finalAddress = `5Post (Ручной ввод): ${pvzQuery}`;
             pickupInfo = null; // ID нет, так как введено руками
         } else {
             window.Telegram?.WebApp?.showAlert('Укажите адрес магазина Пятерочка');
             return;
         }
     } else {
         // Почта России
         if (selectedAddress) {
             finalAddress = [selectedAddress.region, selectedAddress.city, selectedAddress.street, selectedAddress.house, selectedAddress.flat].filter(Boolean).join(', ');
         } else {
             window.Telegram?.WebApp?.showAlert('Выберите сохраненный адрес или добавьте новый в профиле');
             return;
         }
     }

     setLoading(true);
     try {
         const payload = {
            tg_id: user?.id || 1332986231,
            user_info: {
                name: form.name,
                phone: form.phone,
                email: form.email,
                address: finalAddress,
                delivery_method: deliveryMethod,
                pickup_point_id: pickupInfo?.id,
                postal_code: pickupInfo?.postal_code
            },
            items: items,
            items_total: (total + pointsUsed + couponDiscount), 
            final_total: total,
            points_used: pointsUsed,
            coupon_code: activeCoupon,
            coupon_discount: couponDiscount,
            discount_applied: pointsUsed + couponDiscount
         };

         const res = await fetch('https://proshein.com/webhook/create-order', {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify(payload)
         });

         const json = await res.json();
         if (json.status === 'success') {
             window.Telegram?.WebApp?.showAlert(`Заказ #${json.order_id} успешно создан!`);
             onClose(true);
         } else {
             throw new Error(json.message || 'Ошибка сервера');
         }
     } catch (e) {
         window.Telegram?.WebApp?.showAlert('Ошибка: ' + e.message);
     } finally {
         setLoading(false);
     }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-[#101622] flex flex-col animate-slide-up" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Шапка */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#101622] shrink-0 pt-safe-top">
         <button onClick={() => onClose(false)} className="flex items-center gap-1 text-white/50 px-2 py-1 active:opacity-50">
            <span className="material-symbols-outlined text-lg">arrow_back_ios</span><span className="text-sm">Назад</span>
         </button>
         <h2 className="text-white font-bold text-lg">Оформление</h2>
         <div className="w-16"></div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-6">
         
         {/* КОНТАКТЫ (Кнопка "Взять из профиля" удалена) */}
         <section className="space-y-3">
             <h3 className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Контакты получателя</h3>
             <div className="space-y-3">
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="ФИО Получателя" className="custom-input w-full bg-[#1c2636] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} type="tel" placeholder="Телефон (+7...)" className="custom-input w-full bg-[#1c2636] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" placeholder="Email (для чека)" className="custom-input w-full bg-[#1c2636] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
             </div>
         </section>

         {/* ДОСТАВКА */}
         <section className="space-y-3">
             <h3 className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Способ доставки</h3>
             
             <AddressBlock 
                 deliveryMethod={deliveryMethod} setDeliveryMethod={setDeliveryMethod}
                 addresses={addresses} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress}
                 pvzQuery={pvzQuery} setPvzQuery={setPvzQuery} pvzResults={pvzResults}
                 selectedPvz={selectedPvz} setSelectedPvz={setSelectedPvz} loadingPvz={loadingPvz}
                 onOpenProfile={onOpenProfile}
                 onFillFromAddress={handleAddressSelect} 
             />
         </section>

         {/* Соглашения */}
         <section className="space-y-3 pt-2">
             <label className="flex gap-3 items-center cursor-pointer group select-none">
                 <input type="checkbox" checked={form.agreed} onChange={e => setForm({...form, agreed: e.target.checked})} className="w-5 h-5 rounded border-white/30 bg-white/5 checked:bg-primary checked:border-primary appearance-none transition-colors" />
                 <span className="text-xs text-white/60">Я согласен с условиями публичной оферты</span>
             </label>
             <label className="flex gap-3 items-center cursor-pointer group select-none">
                 <input type="checkbox" checked={form.customsAgreed} onChange={e => setForm({...form, customsAgreed: e.target.checked})} className="w-5 h-5 rounded border-white/30 bg-white/5 checked:bg-primary checked:border-primary appearance-none transition-colors" />
                 <span className="text-xs text-white/60">Паспорт для таможни (через СДЭК)</span>
             </label>
         </section>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#101622] border-t border-white/5 pb-safe-bottom z-20">
          <button onClick={handlePay} disabled={loading} className="w-full h-14 bg-primary text-[#102216] font-black rounded-xl text-lg uppercase shadow-[0_0_20px_rgba(19,236,91,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2">
            {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : `Оплатить ${total.toLocaleString()} ₽`}
          </button>
      </div>
    </div>,
    document.body
  );
}
