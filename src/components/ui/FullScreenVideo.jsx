import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function FullScreenVideo({ src, onClose }) {
  
  // Блокируем скролл страницы при открытии видео
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = 'auto';
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black flex flex-col animate-fade-in">
      
      {/* Кнопка закрытия */}
      <button 
        onClick={onClose} 
        className="absolute top-safe-top right-4 z-20 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full text-white backdrop-blur-md mt-4"
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      {/* Видео плеер */}
      <div className="flex-1 flex items-center justify-center relative">
        <video 
           src={src} 
           className="w-full h-full object-contain" 
           controls 
           autoPlay 
           playsInline // Важно для iOS, чтобы не открывался нативный плеер
        />
      </div>
    </div>,
    document.body // Рендерим прямо в body
  );
}
