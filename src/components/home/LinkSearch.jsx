import React, { useState } from 'react';

export default function LinkSearch({ onSearch }) {
  const [link, setLink] = useState('');

  const handleSubmit = () => {
    if (!link.trim()) return;
    onSearch(link);
    setLink(''); // Очистить после ввода
  };

  return (
    <div className="w-full space-y-3">
        <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-white/40">link</span>
            </div>
            <input 
                type="text" 
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Вставьте ссылку на товар SHEIN..." 
                className="w-full h-14 pl-12 pr-4 bg-[#1c2636] border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-lg"
            />
            {link && (
                <button 
                    onClick={() => setLink('')}
                    className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white"
                >
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            )}
        </div>
        
        <button 
            onClick={handleSubmit}
            disabled={!link}
            className={`w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                link 
                ? 'bg-gradient-to-r from-primary to-emerald-600 text-[#102216] shadow-primary/20 active:scale-[0.98]' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
        >
            <span>Найти и добавить</span>
            <span className="material-symbols-outlined">search</span>
        </button>
    </div>
  );
}
