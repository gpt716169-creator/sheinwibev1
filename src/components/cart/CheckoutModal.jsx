import React, { useState, useEffect } from 'react';
import AddressBlock from './AddressBlock';

export default function CheckoutModal({ 
  onClose, 
  user, 
  dbUser, // <-- Сюда прилетает полный объект из базы
  total,
  items,
  pointsUsed,
  couponDiscount,
  activeCoupon,
  // Пропсы для AddressBlock
  addresses, deliveryMethod, setDeliveryMethod,
  selectedAddress, setSelectedAddress,
  pvzQuery, setPvzQuery, pvzResults,
  selectedPvz, setSelectedPvz, loadingPvz,
  onOpenProfile
}) {

  const [form, setForm] = useState({ name: '', phone: '', email: '', agreed: false, customsAgreed: false });
  const [useSavedData, setUseSavedData] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = 'auto';
  }, []);

  // Логика "Взять из профиля"
  useEffect(() => {
    if (useSavedData) {
        // Приоритет: Данные из базы -> Данные из Телеграма -> Пусто
        const name = dbUser?.first_name || dbUser?.name || user?.first_name || '';
        const phone = dbUser?.phone || '';
        const email = dbUser?.email || '';
        setForm(prev => ({ ...prev, name, phone, email }));
    }
  }, [useSavedData, dbUser, user]);

  const handlePay = async () => {
     // 1. Валидация контактов
     if (!form.name || !form.phone) {
         window.Telegram?.WebApp?.showAlert('Заполните Имя и Телефон');
         return;
     }
     if (!form.agreed || !form.customsAgreed) {
         window.Telegram?.WebApp?.showAlert('Примите условия оферты и таможни');
         return;
     }

     // 2. Валидация адреса
     let finalAddress = '';
     let pickupInfo = null;

     if (deliveryMethod === 'ПВЗ (5Post)') {
         if (!selectedPvz) {
             window.Telegram?.WebApp?.showAlert('Выберите пункт выдачи 5Post');
             return;
         }
         finalAddress = `5Post: ${selectedPvz.city}, ${selectedPvz.address} (${selectedPvz.name})`;
         pickupInfo = { id: selectedPvz.id, postal_code: selectedPvz.postal_code };
     } else {
         // Почта / Курьер
         if (selectedAddress) {
             // Если выбрали из сохраненных
             finalAddress = [selectedAddress.region, selectedAddress.city, selectedAddress.street, selectedAddress.house, selectedAddress.flat].filter(Boolean).join(', ');
         } else {
             // Если не выбрали
             window.Telegram?.WebApp?.showAlert('Пожалуйста, выберите сохраненный адрес доставки или добавьте новый в профиле');
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
            items_total: (total + pointsUsed + couponDiscount), // Обратный счет для total amount (сумма товаров)
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
             onClose(true); // true = success
         } else {
             throw new Error(json.message || 'Ошибка сервера');
         }

     } catch (e) {
         window.Telegram?.WebApp?.showAlert('Ошибка: ' + e.message);
     } finally {
         setLoading(false);
     }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#101622] flex flex-col animate-slide-up">
      {/* Шапка (Фиксированная) */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#101622] sticky top-0 z-10 safe-area-top">
         <button onClick={() => onClose(false)} className="flex items-center gap-1 text-white/50 px-2 py-1 active:opacity-50">
            <span className="material-symbols-outlined text-lg">arrow_back_ios</span>
            <span className="text-sm">Назад</span>
         </button>
         <h2 className="text-white font-bold text-lg">Оформление</h2>
         <div className="w-16"></div>
      </div>

      {/* Скроллируемая часть */}
      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-6">
         
         {/* 1. Контакты */}
         <section className="space-y-3">
             <div className="flex justify-between items-center">
                 <h3 className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Контакты получателя</h3>
                 <div onClick={() => setUseSavedData(!useSavedData)} className="flex items-center gap-2 cursor-pointer active:opacity-70">
                     <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${useSavedData ? 'bg-primary border-primary' : 'border-white/30'}`}>
                         {useSavedData && <span className="material-symbols-outlined text-[10px] text-black font-bold">check</span>}
                     </div>
                     <span className="text-primary text-xs font-bold">Взять из профиля</span>
                 </div>
             </div>
             <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="ФИО Получателя" className="custom-input w-full bg-[#1c2636] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
             <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} type="tel" placeholder="Телефон (+7...)" className="custom-input w-full bg-[#1c2636] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
             <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" placeholder="Email (для чека)" className="custom-input w-full bg-[#1c2636] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
         </section>

         {/* 2. Доставка */}
         <section className="space-y-3">
             <h3 className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Способ доставки</h3>
             <AddressBlock 
                 // Пробрасываем все пропсы
                 deliveryMethod={deliveryMethod} setDeliveryMethod={setDeliveryMethod}
                 addresses={addresses} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress}
                 pvzQuery={pvzQuery} setPvzQuery={setPvzQuery} pvzResults={pvzResults}
                 selectedPvz={selectedPvz} setSelectedPvz={setSelectedPvz} loadingPvz={loadingPvz}
                 onOpenProfile={onOpenProfile}
             />
             
             {/* Если выбран адрес и это не 5Post - показываем компактную карточку */}
             {deliveryMethod !== 'ПВЗ (5Post)' && selectedAddress && (
                 <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                     <span className="material-symbols-outlined text-green-500">check_circle</span>
                     <div className="text-xs text-white">
                         <p className="font-bold">Адрес выбран:</p>
                         <p className="opacity-70">{selectedAddress.city}, {selectedAddress.street}</p>
                     </div>
                 </div>
             )}
         </section>

         {/* 3. Соглашения */}
         <section className="space-y-3 pt-2">
             <label className="flex gap-3 items-center cursor-pointer group">
                 <input type="checkbox" checked={form.agreed} onChange={e => setForm({...form, agreed: e.target.checked})} className="w-5 h-5 rounded border-white/30 bg-white/5 checked:bg-primary checked:border-primary appearance-none transition-colors cursor-pointer relative after:content-['✓'] after:absolute after:text-black after:text-xs after:font-bold after:left-[3px] after:top-[1px] checked:after:block after:hidden" />
                 <span className="text-xs text-white/60 group-active:text-white">Я согласен с условиями публичной оферты</span>
             </label>
             <label className="flex gap-3 items-center cursor-pointer group">
                 <input type="checkbox" checked={form.customsAgreed} onChange={e => setForm({...form, customsAgreed: e.target.checked})} className="w-5 h-5 rounded border-white/30 bg-white/5 checked:bg-primary checked:border-primary appearance-none transition-colors cursor-pointer relative after:content-['✓'] after:absolute after:text-black after:text-xs after:font-bold after:left-[3px] after:top-[1px] checked:after:block after:hidden" />
                 <span className="text-xs text-white/60 group-active:text-white">Я предоставлю паспортные данные для таможни (через СДЭК/Брокера)</span>
             </label>
         </section>
      </div>

      {/* Кнопка Оплаты (Фиксированный низ) */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#101622] border-t border-white/5 safe-area-bottom">
          <button 
            onClick={handlePay} 
            disabled={loading}
            className="w-full h-14 bg-primary text-[#102216] font-black rounded-xl text-lg uppercase shadow-[0_0_20px_rgba(19,236,91,0.3)] active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'Оплатить'}
            {!loading && <span>{total.toLocaleString()} ₽</span>}
          </button>
      </div>
    </div>
  );
}
