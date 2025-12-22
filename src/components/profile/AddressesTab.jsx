import React from 'react';

export default function AddressesTab({ addresses, loading, onAdd, onEdit, onDelete }) {
  return (
    <div className="px-6 space-y-4 pb-10 animate-fade-in">
        <button onClick={onAdd} className="w-full py-3 border border-dashed border-white/20 rounded-xl flex items-center justify-center gap-2 text-primary hover:bg-white/5 transition-colors active:scale-98">
            <span className="material-symbols-outlined">add_location_alt</span>
            <span className="font-bold text-sm">Добавить адрес</span>
        </button>

        {loading ? (
             <div className="text-center text-white/30 text-xs py-4">Загрузка...</div>
        ) : addresses.length === 0 ? (
             <p className="text-center text-white/30 text-xs py-4">Нет сохраненных адресов</p>
        ) : (
            addresses.map(addr => {
                const isPvz = addr.street.startsWith('5Post');
                return (
                    <div key={addr.id} onClick={() => onEdit(addr)} className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${addr.is_default ? 'bg-primary/5 border-primary/30' : 'bg-dark-card border-white/5'}`}>
                        {addr.is_default && (
                            <div className="absolute top-3 right-3 text-primary"><span className="material-symbols-outlined text-lg">check_circle</span></div>
                        )}
                        <div className="pr-8">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${isPvz ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {isPvz ? '5Post' : 'Почта РФ'}
                                </span>
                                <h4 className="text-white font-bold text-sm">{addr.full_name}</h4>
                            </div>
                            <p className="text-white/80 text-xs leading-snug">
                                {addr.region ? `${addr.region}, ` : ''}{addr.street}
                            </p>
                            <p className="text-white/40 text-[10px] mt-1">{addr.phone}</p>
                        </div>
                        <button onClick={(e) => onDelete(addr.id, e)} className="absolute bottom-3 right-3 text-white/20 hover:text-red-400 p-1">
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                );
            })
        )}
    </div>
  );
}
