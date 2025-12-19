import React from 'react';

export default function AddressBlock({ 
    deliveryMethod, setDeliveryMethod, addresses, 
    selectedAddress, setSelectedAddress, 
    selectedPvz, setSelectedPvz,
    onOpenProfile,
    onFillFromAddress
}) {

  // Разделяем адреса на 5Post и Обычные
  const courierAddresses = addresses.filter(addr => !((addr.street+addr.city+(addr.region||'')).toLowerCase().includes('5post')));
  const saved5PostAddresses = addresses.filter(addr => (addr.street+addr.city+(addr.region||'')).toLowerCase().includes('5post'));

  // Логика выбора 5Post из списка
  const handleSelectSavedPvz = (addr) => {
      setSelectedPvz({
          id: 'saved_' + addr.id,
          city: addr.city || '',
          address: addr.street || addr.address,
          name: 'Сохраненный пункт',
          postal_code: '000000'
      });
      if (onFillFromAddress) onFillFromAddress(addr);
  };

  // Логика выбора Курьера
  const handleSelectCourier = (addr) => {
      setSelectedAddress(addr);
      if (onFillFromAddress) onFillFromAddress(addr);
  };

  return (
    <div className="space-y-4">
        {/* Переключатель Типа Доставки */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
           <button 
               onClick={() => { setDeliveryMethod('ПВЗ (5Post)'); setSelectedPvz(null); }}
               className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${deliveryMethod === 'ПВЗ (5Post)' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
           >
               <span className="material-symbols-outlined text-base">package_2</span> 5Post
           </button>
           <button 
               onClick={() => { setDeliveryMethod('Почта РФ'); setSelectedAddress(null); }}
               className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${deliveryMethod === 'Почта РФ' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
           >
               <span className="material-symbols-outlined text-base">local_shipping</span> Почта России
           </button>
        </div>

        {/* --- 5POST (ТОЛЬКО СПИСОК) --- */}
        {deliveryMethod === 'ПВЗ (5Post)' && (
            <div className="animate-fade-in space-y-3">
                {saved5PostAddresses.length > 0 ? (
                    <div className="space-y-2">
                        {saved5PostAddresses.map(addr => (
                            <div 
                                key={addr.id}
                                onClick={() => handleSelectSavedPvz(addr)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center gap-3 ${selectedPvz?.id === 'saved_' + addr.id ? 'bg-primary/10 border-primary shadow-[0_0_10px_rgba(19,236,91,0.1)]' : 'bg-[#1c2636] border-white/10 hover:border-white/20'}`}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-white text-sm font-bold truncate">{addr.city}, {addr.street}</p>
                                    <p className="text-white/40 text-[10px] truncate">{addr.full_name} • {addr.phone}</p>
                                </div>
                                {selectedPvz?.id === 'saved_' + addr.id && <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/5">
                        <span className="material-symbols-outlined text-white/20 text-4xl mb-2">no_meeting_room</span>
                        <p className="text-white/50 text-xs mb-4">Нет сохраненных магазинов Пятерочка</p>
                    </div>
                )}
                
                {/* КНОПКА ДОБАВИТЬ */}
                <button onClick={onOpenProfile} className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40 text-xs font-bold transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Добавить новый 5Post в Профиле
                </button>
            </div>
        )}

        {/* --- ПОЧТА РОССИИ (ТОЛЬКО СПИСОК) --- */}
        {deliveryMethod === 'Почта РФ' && (
            <div className="animate-fade-in space-y-3">
                {courierAddresses.length > 0 ? (
                    <div className="space-y-2">
                        {courierAddresses.map(addr => (
                            <div 
                               key={addr.id} 
                               onClick={() => handleSelectCourier(addr)}
                               className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center gap-3 ${selectedAddress?.id === addr.id ? 'bg-primary/10 border-primary shadow-[0_0_10px_rgba(19,236,91,0.1)]' : 'bg-[#1c2636] border-white/10 hover:border-white/20'}`}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-white font-medium truncate">{addr.region ? `${addr.region}, ` : ''}{addr.city}, {addr.street}, {addr.house}</p>
                                    <p className="text-[10px] text-white/50 truncate">
                                        {addr.full_name} • {addr.phone}
                                    </p>
                                </div>
                                {selectedAddress?.id === addr.id && <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/5">
                        <span className="material-symbols-outlined text-white/20 text-4xl mb-2">home_pin</span>
                        <p className="text-white/50 text-xs mb-4">Нет сохраненных адресов</p>
                    </div>
                )}

                {/* КНОПКА ДОБАВИТЬ */}
                <button onClick={onOpenProfile} className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40 text-xs font-bold transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Добавить адрес в Профиле
                </button>
            </div>
        )}
    </div>
  );
}
