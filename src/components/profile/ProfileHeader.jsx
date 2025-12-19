import React from 'react';

export default function ProfileHeader({ user, dbUser }) {
  return (
    <div className="flex flex-col items-center pt-8 pb-6 shrink-0">
         <div className="w-24 h-24 rounded-full bg-cover bg-center border-4 border-[#102216] shadow-xl relative bg-[#2a3441]">
             <div className="absolute inset-0 rounded-full bg-cover bg-center" style={{backgroundImage: user?.photo_url ? `url('${user.photo_url}')` : 'none'}}></div>
             {!user?.photo_url && <span className="material-symbols-outlined text-white/30 text-4xl absolute inset-0 flex items-center justify-center">person</span>}
         </div>
         <h2 className="text-white text-xl font-bold mt-3">{user?.first_name}</h2>
         <div className="flex gap-2 mt-2">
             <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-[#cd7f32] border border-white/5 uppercase tracking-wider">
                {dbUser?.status_level || 'Bronze'}
             </span>
             <span className="px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary border border-primary/20">
                {dbUser?.points || 0} WIBE
             </span>
         </div>
    </div>
  );
}
