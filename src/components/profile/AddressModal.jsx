import React, { useState, useEffect } from 'react';

export default function AddressModal({ isOpen, onClose, editingAddress, user, onSave }) {
  if (!isOpen) return null;

  // --- STATE ---
  const [deliveryMethod, setDeliveryMethod] = useState('ПВЗ (5Post)');
  
  // Основные данные
  const [form, setForm] = useState({
      id: null,
      full_name: '',
      phone: '',
      email: '',
      is_default: false
  });

  // Данные адреса (храним отдельно для удобства ввода)
  const [addrDetails, setAddrDetails] = useState({
      city: '',       // Город нужен всегда
      street: '',     // Улица/Дом или Описание постамата
      postal_code: '' // Только для Почты РФ
  });

  // --- INIT ---
  useEffect(() => {
      if (editingAddress) {
          // --- РЕДАКТИРОВАНИЕ ---
          const isPvz = editingAddress.street.startsWith('5Post');
          setDeliveryMethod(isPvz ? 'ПВЗ (5Post)' : 'Почта РФ');

          setForm({
              id: editingAddress.id,
              full_name: editingAddress.full_name,
              phone: editingAddress.phone,
              email: editingAddress.email || '',
              is_default: editingAddress.is_default
          });

          // Пытаемся красиво разложить адрес обратно по полям
          let cleanStreet = editingAddress.street;
          let code = '';

          if (isPvz) {
              // Убираем префикс "5Post: "
              cleanStreet = cleanStreet.replace('5Post: ', '');
          } else {
              // Для почты пытаемся найти индекс в начале (6 цифр)
              const indexMatch = cleanStreet.match(/^(\d{6}),\s*(.*)/);
              if (indexMatch) {
                  code = indexMatch[1];
                  cleanStreet = indexMatch[2];
              }
          }

          setAddrDetails({
              city: editingAddress.region || '',
              street: cleanStreet,
              postal_code: code
          });

      } else {
          // --- СОЗДАНИЕ НОВОГО ---
          setDeliveryMethod('ПВЗ (5Post)');
          setForm({
              id: null,
              full_name: '', // Убрали user.first_name, теперь пусто
              phone: '',
              email: user?.email || '', // Email можно оставить, если он был сохранен ранее
              is_default: false
          });
          setAddrDetails({ city: '', street: '', postal_code: '' });
      }
  }, [editingAddress, user]);


  // --- SAVE ---
  const handleSave = () => {
      // Валидация
      if (!form.full_name || !form.phone || !form.email) {
          window.Telegram?.WebApp?.showAlert("Заполните ФИО, телефон и Email");
          return;
      }
      if (!addrDetails.city) {
          window.Telegram?.WebApp?.showAlert("Укажите город");
          return;
      }
      if (!addrDetails.street) {
          window.Telegram?.WebApp?.showAlert(deliveryMethod === 'ПВЗ (5Post)' ? "Укажите адрес постамата" : "Укажите улицу и дом");
          return;
      }
      if (deliveryMethod === 'Почта РФ' && !addrDetails.postal_code) {
          window.Telegram?.WebApp?.showAlert("Укажите почтовый индекс");
          return;
      }

      // Формирование итоговой строки адреса для базы
      let finalStreetString = addrDetails.street;

      if (deliveryMethod === 'ПВЗ (5Post)') {
          // Маркируем, что это 5Post
          finalStreetString = `5Post: ${addrDetails.street}`;
      } else {
          // Для почты добавляем индекс в начало строки
          finalStreetString = `${addrDetails.postal_code}, ${addrDetails.street}`;
      }

      onSave({
          ...form,
          region: addrDetails.city,
          street: finalStreetString
      });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#101622] flex flex-col animate-slide-up">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#101622] sticky top-0 z-10">
            <button onClick={onClose} className="text-white/50 hover:text-white">Отмена</button>
            <h3 className="text-white font-bold">{form.id ? 'Редактировать' : 'Новый адрес'}</h3>
            <button onClick={handleSave} className="text-primary font-bold">Сохранить</button>
        </div>
        
        {/* FORM BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-20">
            
            {/* 1. КОНТАКТЫ */}
            <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-white/40 ml-1">Контактные данные</h4>
                
                {/* ФИО */}
                <input 
                    name="fullName" // Уникальное имя для автозаполнения
                    autoComplete="name"
                    className="custom-input w-full rounded-xl px-4 py-3 text-sm" 
                    value={form.full_name} 
                    onChange={e => setForm({...form, full_name: e.target.value})} 
                    placeholder="ФИО Получателя (как в паспорте)" 
                />
                
                {/* ТЕЛЕФОН */}
                <input 
                    name="phone"
                    autoComplete="tel"
                    type="tel" 
                    className="custom-input w-full rounded-xl px-4 py-3 text-sm" 
                    value={form.phone} 
                    onChange={e => setForm({...form, phone: e.target.value})} 
                    placeholder="Телефон (+7...)" 
                />
                
                {/* EMAIL */}
                <input 
                    name="emailAddress" // Отдельное имя, чтобы не лезло в ФИО
                    autoComplete="email"
                    type="email" 
                    className="custom-input w-full rounded-xl px-4 py-3 text-sm" 
                    value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})} 
                    placeholder="Email (для чеков)" 
                />
            </div>

            {/* 2. ТИП ДОСТАВКИ */}
            <div className="space-y-3">
                 <h4 className="text-[10px] uppercase font-bold text-white/40 ml-1">Способ доставки</h4>
                 <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                    <button 
                        onClick={() => setDeliveryMethod('ПВЗ (5Post)')} 
                        className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${deliveryMethod === 'ПВЗ (5Post)' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}
                    >
                        📦 5Post
                    </button>
                    <button 
                        onClick={() => setDeliveryMethod('Почта РФ')} 
                        className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${deliveryMethod === 'Почта РФ' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}
                    >
                        🏠 Почта РФ
                    </button>
                 </div>
            </div>

            {/* 3. АДРЕС (ДИНАМИЧЕСКИЙ БЛОК) */}
            <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-white/40 ml-1">
                    {deliveryMethod === 'ПВЗ (5Post)' ? 'Где забирать?' : 'Адрес проживания'}
                </h4>

                {/* ОБЩЕЕ ПОЛЕ: ГОРОД */}
                <input 
                    className="custom-input w-full rounded-xl px-4 py-3 text-sm" 
                    value={addrDetails.city} 
                    onChange={e => setAddrDetails({...addrDetails, city: e.target.value})} 
                    placeholder="Город (например: Москва)" 
                />

                {/* СПЕЦИФИКА ДЛЯ 5POST */}
                {deliveryMethod === 'ПВЗ (5Post)' && (
                    <div className="animate-fade-in space-y-3">
                        <textarea 
                            className="custom-input w-full rounded-xl px-4 py-3 text-sm min-h-[80px]" 
                            value={addrDetails.street} 
                            onChange={e => setAddrDetails({...addrDetails, street: e.target.value})} 
                            placeholder="Точный адрес постамата или кассы.&#10;Например: ул. Ленина 5" 
                        />
                        <p className="text-[10px] text-white/40 ml-1">
                            *Укажите улицу и номер дома где именно находится пункт 5Post.
                        </p>
                    </div>
                )}

                {/* СПЕЦИФИКА ДЛЯ ПОЧТЫ РФ */}
                {deliveryMethod === 'Почта РФ' && (
                    <div className="animate-fade-in space-y-3">
                        <input 
                            type="number"
                            className="custom-input w-full rounded-xl px-4 py-3 text-sm" 
                            value={addrDetails.postal_code} 
                            onChange={e => setAddrDetails({...addrDetails, postal_code: e.target.value})} 
                            placeholder="Почтовый индекс (обязательно)" 
                        />
                        <input 
                            className="custom-input w-full rounded-xl px-4 py-3 text-sm" 
                            value={addrDetails.street} 
                            onChange={e => setAddrDetails({...addrDetails, street: e.target.value})} 
                            placeholder="Улица, Дом, Квартира" 
                        />
                    </div>
                )}
            </div>

            {/* 4. ЧЕКБОКС ОСНОВНОГО */}
            <div className="pt-2 flex items-center justify-between border-t border-white/5">
                <span className="text-sm text-white">Сделать основным адресом</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={form.is_default} onChange={e => setForm({...form, is_default: e.target.checked})} />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>
        </div>
    </div>
  );
}
