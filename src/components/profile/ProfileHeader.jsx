import React from 'react';

export default function ProfileHeader({ user, dbUser }) {
  
  // 1. Достаем название статуса (или Bronze, если пусто)
  const statusName = dbUser?.status_level || 'Bronze';
  
  // 2. Функция, которая отдает ЦВЕТА в зависимости от названия
  const getStatusStyle = (status) => {
      // Приводим к нижнему регистру для надежности сравнения
      const s = String(status).toLowerCase();

      if (s.includes('platinum')) {
          return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]';
      }
      if (s.includes('gold')) {
          return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.2)]';
      }
      if (s.includes('silver')) {
          return 'text-gray-300 bg-gray-300/10 border-gray-300/20';
      }
      
      // По умолчанию (Bronze)
      return 'text-[#cd7f32] bg-[#cd7f32]/10 border-[#cd7f32]/20';
  };

  return (
    <div className="flex flex-col items-center pt-8 pb-6 shrink-0 animate-scale-in">
         {/* АВАТАРКА */}
         <div className="w-24 h-24 rounded-full bg-cover bg-center border-4 border-[#102216] shadow-xl relative bg-[#2a3441]">
             <div className="absolute inset-0 rounded-full bg-cover bg-center" style={{backgroundImage: user?.photo_url ? `url('${user.photo_url}')` : 'none'}}></div>
             {!user?.photo_url && <span className="material-symbols-outlined text-white/30 text-4xl absolute inset-0 flex items-center justify-center">person</span>}
         </div>
         
         {/* ИМЯ */}
         <h2 className="text-white text-xl font-bold mt-3">{user?.first_name}</h2>
         
         {/* ИНФО */}
         <div className="flex gap-2 mt-2">
             
             {/* СТАТУС (Динамический стиль) */}
             <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider transition-all ${getStatusStyle(statusName)}`}>
                {statusName}
             </span>

             {/* БАЛЛЫ */}
             <span className="px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary border border-primary/20">
                {dbUser?.points || 0} WIBE
             </span>
         </div>
    </div>
  );
}
