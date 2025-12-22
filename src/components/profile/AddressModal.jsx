import React, { useState, useEffect } from 'react';
import PickupSelector from './PickupSelector'; // Импортируй компонент из Шага 2

export default function AddressModal({ isOpen, onClose, editingAddress, user, onSave }) {
  if (!isOpen) return null;

  // --- STATE ---
  const [deliveryMethod, setDeliveryMethod] = useState('ПВЗ (5Post)');
  const [showSelector, setShowSelector] = useState(false); // Открытие поиска
  
  // Основные данные
  const [form, setForm] = useState({
      id: null,
      full_name: '',
      phone: '',
      email: '',
      is_default: false
  });

  // Данные адреса
  const [addrDetails, setAddrDetails] = useState({
      city: '',       
      street: '',     
      postal_code: '',
      pickup_point_id: null // <--- ВАЖНОЕ НОВОЕ ПОЛЕ (UUID)
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

          // Пытаемся восстановить данные
          let cleanStreet = editingAddress.street;
          let code = '';

          if (isPvz) {
              cleanStreet = cleanStreet.replace('5Post: ', '');
          } else {
              const indexMatch = cleanStreet.match(/^(\d{6}),\s*(.*)/);
              if (indexMatch) {
                  code = indexMatch[1];
                  cleanStreet = indexMatch[2];
              }
          }

          setAddrDetails({
              city: editingAddress.region || '',
              street: cleanStreet,
              postal_code: code,
              // Если в старом адресе был сохранен ID (в metadata или скрытом поле), его надо достать
              // Если нет - при редактировании придется выбрать заново, если хочешь обновить ID
              pickup_point_id: editingAddress.pickup_point_id || null 
          });

      } else {
          // --- СОЗДАНИЕ НОВОГО ---
          setDeliveryMethod('ПВЗ (5Post)');
          setForm({
              id: null,
              full_name: '', 
              phone: '',
              email: user?.email || '',
              is_default: false
          });
          setAddrDetails({ city: '', street: '', postal_code: '', pickup_point_id: null });
      }
  }, [editingAddress, user]);


  // --- ОБРАБОТЧИК ВЫБОРА ИЗ СПИСКА ---
  const handlePointSelect = (point) => {
      setAddrDetails({
          ...addrDetails,
          city: point.city,
          street: point.full_address || point.address, // Текст для отображения
          postal_code: point.postal_code, // Индекс подтянется сам!
          pickup_point_id: point.id // Сохраняем ID!
      });
      setShowSelector(false); // Закрываем поиск
  };


  // --- SAVE ---
  const handleSave = () => {
      // Валидация
      if (!form.full_name || !form.phone || !form.email) {
          window.Telegram?.WebApp?.showAlert("Заполните ФИО, телефон и Email");
          return;
      }
      
      if (deliveryMethod === 'ПВЗ (5Post)' && !addrDetails.pickup_point_id) {
           // Если пользователь ввел текст руками, но не выбрал из списка -> ID нет.
           // Можно разрешить, но тогда в n8n снова проблемы. Лучше заставить выбрать.
           window.Telegram?.WebApp?.showAlert("Пожалуйста, выберите пункт выдачи из списка");
           return;
      }

      if (deliveryMethod === 'Почта РФ' && (!addrDetails.city || !addrDetails.street || !addrDetails.postal_code)) {
          window.Telegram?.WebApp?.showAlert("Заполните адрес и индекс");
          return;
      }

      // Формирование итоговой строки
      let finalStreetString = addrDetails.street;

      if (deliveryMethod === 'ПВЗ (5Post)') {
          finalStreetString = `5Post: ${addrDetails.street}`;
      } else {
          finalStreetString = `${addrDetails.postal_code}, ${addrDetails.street}`;
      }

      onSave({
          ...form,
          region: addrDetails.city,
          street: finalStreetString,
          pickup_point_id: addrDetails.pickup_point_id // Отправляем ID в базу!
      });
  };

  return (
    <>
    {/* Всплывающее окно поиска (показываем поверх, если showSelector=true) */}
    {showSelector && (
        <PickupSelector onSelect={handlePointSelect} onClose={() => setShowSelector(false)} />
    )}

    <div className="fixed inset-0 z-[60] bg-[#101622] flex flex-col animate-slide-up">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#101622] sticky top-0 z-10">
            <button onClick={onClose} className="text-white/50 hover:text-white">Отмена</button>
            <h3 className="text-white font-bold">{form.id ? 'Редактировать' : 'Новый адрес'}</h3>
            <button onClick={handleSave} className="text-primary font-bold">Сохранить</button>
        </div>
        
        {/* FORM BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-20">
            
            {/* 1. КОНТАКТЫ (Без изменений) */}
            <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-white/40 ml-1">Контактные данные</h4>
                <input 
                    name="fullName"
                    className="custom-input w-full rounded-xl px-4 py-3 text-sm" 
                    value={form.full_name} 
                    onChange={e => setForm({...form, full_name: e.target.value})} 
                    placeholder="ФИО Получателя" 
                />
                <input 
                    name="phone"
                    type="tel" 
                    className="custom-input w-full rounded-xl px-4 py-3 text-sm" 
                    value={form.phone} 
                    onChange={e => setForm({...form, phone: e.target.value})} 
                    placeholder="Телефон" 
                />
                <input 
                    name="emailAddress"
                    type="email" 
                    className="custom-input w-full rounded-xl px-4 py-3 text-sm" 
                    value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})} 
                    placeholder="Email" 
                />
            </div>

            {/* 2. ТИП ДОСТАВКИ (Без изменений) */}
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

            {/* 3. АДРЕС (ИЗМЕНЕНО) */}
            <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-white/40 ml-1">
                    {deliveryMethod === 'ПВЗ (5Post)' ? 'Пункт выдачи' : 'Адрес проживания'}
                </h4>

                {/* --- ВАРИАНТ: 5POST (ВЫБОР ИЗ СПИСКА) --- */}
                {deliveryMethod === 'ПВЗ (5Post)' && (
                    <div className="animate-fade-in space-y-3">
                        {/* Если адрес уже выбран, показываем его красиво */}
                        {addrDetails.street ? (
                            <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                                <div className="text-white text-sm font-bold">{addrDetails.city}</div>
                                <div className="text-white/70 text-xs mt-1">{addrDetails.street}</div>
                                <div className="mt-3">
                                    <button 
                                        onClick={() => setShowSelector(true)} 
                                        className="text-primary text-xs font-bold uppercase tracking-wider"
                                    >
                                        Изменить пункт выдачи
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Если не выбран - большая кнопка
                            <button 
                                onClick={() => setShowSelector(true)}
                                className="w-full py-4 rounded-xl border border-dashed border-white/30 text-white/50 hover:bg-white/5 hover:text-white transition-all text-sm font-medium"
                            >
                                🔍 Найти пункт выдачи на карте
                            </button>
                        )}
                    </div>
                )}

                {/* --- ВАРИАНТ: ПОЧТА РФ (РУЧНОЙ ВВОД) --- */}
                {deliveryMethod === 'Почта РФ' && (
                    <div className="animate-fade-in space-y-3">
                        <input 
                            className="custom-input w-full rounded-xl px-4 py-3 text-sm" 
                            value={addrDetails.city} 
                            onChange={e => setAddrDetails({...addrDetails, city: e.target.value})} 
                            placeholder="Город" 
                        />
                        <input 
                            type="number"
                            className="custom-input w-full rounded-xl px-4 py-3 text-sm" 
                            value={addrDetails.postal_code} 
                            onChange={e => setAddrDetails({...addrDetails, postal_code: e.target.value})} 
                            placeholder="Почтовый индекс" 
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
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5"></div>
                </label>
            </div>
        </div>
    </div>
    </>
  );
}
