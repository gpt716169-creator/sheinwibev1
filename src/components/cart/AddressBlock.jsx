import React from 'react';

export default function AddressBlock({ 
    deliveryMethod, setDeliveryMethod, addresses, 
    selectedAddress, setSelectedAddress, 
    pvzQuery, setPvzQuery, pvzResults, 
    selectedPvz, setSelectedPvz, loadingPvz,
    onOpenProfile,
    onFillFromAddress // <-- ПОЛУЧАЕМ ФУНКЦИЮ ИЗ РОДИТЕЛЯ
}) {

  const courierAddresses = addresses.filter(addr => !((addr.street+addr.city+(addr.region||'')).toLowerCase().includes('5post')));
  const saved5PostAddresses = addresses.filter(addr => (addr.street+addr.city+(addr.region||'')).toLowerCase().includes('5post'));

  // Клик по сохраненному 5Post
  const handleSelectSavedPvz = (addr) => {
      // 1. Устанавливаем точку ПВЗ (визуально)
      setSelectedPvz({
          id: 'saved_' + addr.id,
          city: addr.city || '',
          address: addr.street || addr.address,
          name: 'Сохраненный пункт',
          postal_code: '000000'
      });
      
      // 2. !!! ЗАПОЛНЯЕМ ФОРМУ ДАННЫМИ ИЗ ЭТОГО АДРЕСА !!!
      if (onFillFromAddress) onFillFromAddress(addr);
  };

  return (
    <div className="space-y-4">
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
           <button onClick={() => { setDeliveryMethod('ПВЗ (5Post)'); setSelectedPvz(null); }} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${deliveryMethod === 'ПВЗ (5Post)' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}>
               <span className="material-symbols-outlined text-base">package_2</span> 5Post
           </button>
           <button onClick={() => { setDeliveryMethod('Почта РФ'); setSelectedAddress(null); }} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${deliveryMethod === 'Почта РФ' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}>
               <span className="material-symbols-outlined text-base">local_shipping</span> Почта / Курьер
           </button>
        </div>

        {/* --- 5POST --- */}
        {deliveryMethod === 'ПВЗ (5Post)' && (
            <div className="animate-fade-in space-y-3">
                {!selectedPvz ? (
                    <div className="space-y-3">
                        {/* Сохраненные */}
                        {saved5PostAddresses.length > 0 && (
                            <div className="space-y-2 mb-4">
                                <p className="text-[10px] text-white/40 font-bold uppercase pl-1">Сохраненные пункты</p>
                                {saved5PostAddresses.map(addr => (
                                    <div 
                                        key={addr.id}
                                        onClick={() => handleSelectSavedPvz(addr)} // <-- КЛИК ТУТ
                                        className="p-3 rounded-xl border border-white/10 bg-[#1c2636] cursor-pointer hover:border-primary/50 flex items-center gap-3 active:scale-[0.98] transition-transform"
                                    >
                                        <span className="material-symbols-outlined text-primary text-xl">history</span>
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-bold truncate">{addr.city}, {addr.street}</p>
                                            <p className="text-white/40 text-[10px]">
                                                {addr.full_name} • {addr.phone}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Поиск */}
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-3.5 text-white/40">search</span>
                            <input className="custom-input w-full rounded-xl pl-10 pr-4 py-3 text-sm bg-[#1c2636] border border-white/10 text-white focus:border-primary outline-none" placeholder="Найти новый (Город, улица...)" value={pvzQuery} onChange={(e) => setPvzQuery(e.target.value)} />
                            {loadingPvz && <div className="absolute right-3 top-3.5"><span className="material-symbols-outlined animate-spin text-primary text-sm">progress_activity</span></div>}
                            {pvzResults.length > 0 && (
                                <div className="mt-2 bg-[#1c2636] border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                    {pvzResults.map(pvz => (
                                        <div key={pvz.id} onClick={() => setSelectedPvz(pvz)} className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer active:bg-white/10 last:border-0">
                                            <p className="text-white text-sm font-bold leading-tight">{pvz.city}, {pvz.address}</p>
                                            <p className="text-white/50 text-[10px] mt-1">{pvz.name}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl flex justify-between items-center gap-3 animate-fade-in">
                        <div className="min-w-0">
                            <p className="text-primary text-[10px] font-bold uppercase mb-1">Выбран пункт:</p>
                            <p className="text-white text-sm font-medium leading-snug truncate">{selectedPvz.city}, {selectedPvz.address}</p>
                            <p className="text-white/40 text-[10px] truncate">{selectedPvz.name}</p>
                        </div>
                        <button onClick={() => { setSelectedPvz(null); setPvzQuery(''); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 shrink-0">
                            <span className="material-symbols-outlined text-white/70 text-sm">close</span>
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* --- ПОЧТА --- */}
        {deliveryMethod === 'Почта РФ' && (
            <div className="animate-fade-in space-y-3">
                {courierAddresses.length > 0 ? (
                    <div className="space-y-2">
                        {courierAddresses.map(addr => (
                            <div 
                               key={addr.id} 
                               onClick={() => {
                                   setSelectedAddress(addr);
                                   if(onFillFromAddress) onFillFromAddress(addr); // <-- КЛИК ТУТ (И ПЕРЕДАЕМ ДАННЫЕ)
                               }}
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
                    <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/5">
                        <p className="text-white/50 text-xs mb-3">Нет сохраненных адресов для курьера</p>
                        <button onClick={onOpenProfile} className="bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-white/20">
                            + Добавить в Профиле
                        </button>
                    </div>
                )}
            </div>
        )}
    </div>
  );
}
