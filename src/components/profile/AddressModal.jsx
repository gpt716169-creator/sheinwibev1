import React, { useState, useEffect } from 'react';
import AddressBlock from '../cart/AddressBlock'; // <-- РЕЮЗ ИЗ КОРЗИНЫ!

export default function AddressModal({ isOpen, onClose, editingAddress, user, onSave }) {
  if (!isOpen) return null;

  // Local State
  const [form, setForm] = useState({
      id: null,
      full_name: '',
      phone: '',
      is_default: false
  });
  
  // State для AddressBlock
  const [deliveryMethod, setDeliveryMethod] = useState('ПВЗ (5Post)');
  // Для ПВЗ
  const [pvzQuery, setPvzQuery] = useState('');
  const [pvzResults, setPvzResults] = useState([]);
  const [selectedPvz, setSelectedPvz] = useState(null);
  const [loadingPvz, setLoadingPvz] = useState(false);
  // Для Курьера (используем как поля ввода)
  const [manualAddress, setManualAddress] = useState({ region: '', street: '' });

  // Init Form
  useEffect(() => {
      if (editingAddress) {
          const isPvz = editingAddress.street.startsWith('5Post');
          setForm({
              id: editingAddress.id,
              full_name: editingAddress.full_name,
              phone: editingAddress.phone,
              is_default: editingAddress.is_default
          });
          setDeliveryMethod(isPvz ? 'ПВЗ (5Post)' : 'Почта РФ');
          
          if (isPvz) {
               // Пытаемся распарсить строку "5Post: Город, Улица (Имя)"
               // Но для UI проще просто показать, что выбрано. 
               // В реале лучше хранить ID пвз отдельно, но пока так:
               const cleanAddr = editingAddress.street.replace('5Post: ', '');
               setSelectedPvz({ address: cleanAddr, city: editingAddress.region, name: 'Сохраненный' });
          } else {
               setManualAddress({ region: editingAddress.region, street: editingAddress.street });
          }
      } else {
          // New Address
          setForm({
              id: null,
              full_name: user?.first_name || '',
              phone: '',
              is_default: false
          });
          setDeliveryMethod('ПВЗ (5Post)');
          setSelectedPvz(null);
          setManualAddress({ region: '', street: '' });
      }
  }, [editingAddress, user]);

  // Search Logic (Copy from Cart)
  useEffect(() => {
    const t = setTimeout(() => {
      if (pvzQuery.length > 2 && !selectedPvz) searchPvz(pvzQuery);
    }, 600);
    return () => clearTimeout(t);
  }, [pvzQuery]);

  const searchPvz = async (q) => {
      setLoadingPvz(true);
      try {
          const res = await fetch(`https://proshein.com/webhook/search-pvz?q=${encodeURIComponent(q)}`);
          const rawData = await res.json();
          let list = [];
          if (Array.isArray(rawData)) list = rawData;
          else if (rawData?.json && Array.isArray(rawData.json)) list = rawData.json;
          else if (rawData?.data && Array.isArray(rawData.data)) list = rawData.data;
          else if (rawData?.rows && Array.isArray(rawData.rows)) list = rawData.rows;
          setPvzResults(list);
      } catch (e) { console.error(e); } finally { setLoadingPvz(false); }
  };

  const handleSave = () => {
      let finalStreet = '';
      let finalRegion = '';

      if (deliveryMethod === 'ПВЗ (5Post)') {
          if (!selectedPvz) {
              window.Telegram?.WebApp?.showAlert("Выберите ПВЗ");
              return;
          }
          finalStreet = `5Post: ${selectedPvz.city}, ${selectedPvz.address} (${selectedPvz.name})`;
          finalRegion = selectedPvz.city;
      } else {
          if (!manualAddress.street) {
              window.Telegram?.WebApp?.showAlert("Введите улицу");
              return;
          }
          finalStreet = manualAddress.street;
          finalRegion = manualAddress.region;
      }

      onSave({
          ...form,
          region: finalRegion,
          street: finalStreet
      });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#101622] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#101622]">
            <button onClick={onClose} className="text-white/50 hover:text-white">Отмена</button>
            <h3 className="text-white font-bold">{form.id ? 'Редактировать' : 'Новый адрес'}</h3>
            <button onClick={handleSave} className="text-primary font-bold">Сохранить</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">Контактное лицо</label>
                    <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="ФИО" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">Телефон</label>
                    <input type="tel" className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+7..." />
                </div>

                {/* --- REUSED COMPONENT --- */}
                {/* Хитрость: AddressBlock ожидает, что мы передадим ему "адреса" для курьерки, чтобы выбрать из списка.
                    Но здесь мы СОЗДАЕМ адрес.
                    Поэтому для Курьера нам нужны просто инпуты, а для ПВЗ - поиск.
                    AddressBlock идеально подходит для ПВЗ, но для Курьера там "выбор из списка".
                    
                    Давай для ПВЗ используем AddressBlock (ради поиска), а для Курьера нарисуем инпуты сами.
                */}
                
                <div className="space-y-1.5">
                     <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">Тип доставки</label>
                     <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-3">
                        <button onClick={() => setDeliveryMethod('ПВЗ (5Post)')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${deliveryMethod === 'ПВЗ (5Post)' ? 'bg-white/10 text-white' : 'text-white/40'}`}>📦 5Post</button>
                        <button onClick={() => setDeliveryMethod('Почта РФ')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${deliveryMethod === 'Почта РФ' ? 'bg-white/10 text-white' : 'text-white/40'}`}>🏠 Курьер</button>
                     </div>
                </div>

                {deliveryMethod === 'ПВЗ (5Post)' ? (
                     <div className="space-y-2">
                        {/* Мы используем AddressBlock только частично, или верстаем поиск сами, т.к. AddressBlock слишком заточен под Корзину. 
                            Давай лучше сверстаем поиск здесь, это проще чем хакать пропсы AddressBlock.
                        */}
                         {!selectedPvz ? (
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-3.5 text-white/40">search</span>
                                <input className="custom-input w-full rounded-xl pl-10 pr-4 py-3 text-sm" placeholder="Город, Улица..." value={pvzQuery} onChange={(e) => setPvzQuery(e.target.value)} />
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
                            <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="text-primary text-[10px] font-bold uppercase mb-1">Выбран 5Post</p>
                                    <p className="text-white text-sm font-medium leading-snug">{selectedPvz.city}, {selectedPvz.address}</p>
                                </div>
                                <button onClick={() => setSelectedPvz(null)} className="text-white/50 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                            </div>
                        )}
                     </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">Регион / Город</label>
                            <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={manualAddress.region} onChange={e => setManualAddress({...manualAddress, region: e.target.value})} placeholder="г. Москва" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">Улица, Дом, Квартира</label>
                            <input className="custom-input w-full rounded-xl px-4 py-3 text-sm" value={manualAddress.street} onChange={e => setManualAddress({...manualAddress, street: e.target.value})} placeholder="ул. Ленина, д. 1" />
                        </div>
                    </div>
                )}
                
                <div className="pt-4 flex items-center justify-between">
                    <span className="text-sm text-white">Использовать как основной</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={form.is_default} onChange={e => setForm({...form, is_default: e.target.checked})} />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>
        </div>
    </div>
  );
}
