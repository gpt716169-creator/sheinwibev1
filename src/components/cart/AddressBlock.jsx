import React from 'react';

export default function AddressBlock({ 
    deliveryMethod, 
    setDeliveryMethod, 
    addresses, 
    selectedAddress, 
    setSelectedAddress, 
    pvzQuery, 
    setPvzQuery, 
    pvzResults, 
    selectedPvz, 
    setSelectedPvz,
    loadingPvz,
    onOpenProfile // Чтобы отправить юзера добавлять адрес в профиль
}) {

  return (
    <div className="space-y-4">
        {/* Переключатель доставки */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
           <button 
               onClick={() => setDeliveryMethod('ПВЗ (5Post)')}
               className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${deliveryMethod === 'ПВЗ (5Post)' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}
           >
               📦 5Post (Пятерочка)
           </button>
           <button 
               onClick={() => setDeliveryMethod('Почта РФ')}
               className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${deliveryMethod === 'Почта РФ' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40'}`}
           >
               🏠 Почта / Курьер
           </button>
        </div>

        {/* --- ЛОГИКА 5POST --- */}
        {deliveryMethod === 'ПВЗ (5Post)' && (
            <div className="animate-fade-in space-y-3">
                {!selectedPvz ? (
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-3.5 text-white/40">search</span>
                        <input 
                           className="custom-input w-full rounded-xl pl-10 pr-4 py-3 text-sm" 
                           placeholder="Город, Улица (например: Москва Ленина)"
                           value={pvzQuery}
                           onChange={(e) => setPvzQuery(e.target.value)}
                        />
                        {loadingPvz && <div className="absolute right-3 top-3.5"><span className="material-symbols-outlined animate-spin text-primary text-sm">progress_activity</span></div>}
                        
                        {/* Результаты поиска */}
                        {pvzResults.length > 0 && (
                            <div className="mt-2 bg-[#1c2636] border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto absolute z-50 w-full shadow-2xl shadow-black">
                                {pvzResults.map(pvz => (
                                    <div key={pvz.id} onClick={() => setSelectedPvz(pvz)} className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                                        <p className="text-white text-sm font-bold">{pvz.city}, {pvz.address}</p>
                                        <p className="text-white/50 text-[10px]">{pvz.name}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl flex justify-between items-center">
                        <div>
                            <p className="text-primary text-[10px] font-bold uppercase mb-1">Выбран пункт:</p>
                            <p className="text-white text-sm font-medium leading-snug">{selectedPvz.city}, {selectedPvz.address}</p>
                            <p className="text-white/40 text-[10px]">{selectedPvz.name}</p>
                        </div>
                        <button onClick={() => { setSelectedPvz(null); setPvzQuery(''); }} className="text-white/50 hover:text-white p-2">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* --- ЛОГИКА КУРЬЕРА --- */}
        {deliveryMethod === 'Почта РФ' && (
            <div className="animate-fade-in space-y-3">
                {addresses.length > 0 ? (
                    <div className="space-y-2">
                        {addresses.map(addr => (
                            <div 
                               key={addr.id} 
                               onClick={() => setSelectedAddress(addr)}
                               className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedAddress?.id === addr.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10'}`}
                            >
                                <div>
                                    <p className="text-sm text-white font-medium">{addr.region}, {addr.street}</p>
                                    <p className="text-[10px] text-white/50">{addr.full_name}</p>
                                </div>
                                {selectedAddress?.id === addr.id && <span className="material-symbols-outlined text-primary">check_circle</span>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 border border-dashed border-white/10 rounded-xl">
                        <p className="text-white/50 text-xs mb-2">Нет сохраненных адресов</p>
                        <button onClick={onOpenProfile} className="text-primary font-bold text-sm">Добавить в Профиле</button>
                    </div>
                )}
            </div>
        )}
    </div>
  );
}
