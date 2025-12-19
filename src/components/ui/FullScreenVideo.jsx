import React, { useEffect, useRef } from 'react';

export default function FullScreenVideo({ src, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    // Пытаемся запустить видео автоматически при открытии
    if (videoRef.current) {
        videoRef.current.play().catch(e => console.log("Autoplay blocked:", e));
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center animate-fade-in">
        {/* Кнопка закрытия (крестик) */}
        <button 
            onClick={onClose} 
            className="absolute top-8 right-6 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all"
        >
            <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Само видео */}
        <video 
            ref={videoRef}
            src={src}
            className="w-full h-full object-contain max-h-screen"
            controls={false} // Скрываем стандартные контролы, чтобы выглядело как сторис
            playsInline // Важно для iPhone, чтобы не открывался нативный плеер
            autoPlay
            onEnded={onClose} // Закрываем, когда видео доиграло
            onClick={(e) => {
                // Пауза/Плей по клику на экран
                if(e.target.paused) e.target.play();
                else e.target.pause();
            }}
        />

        {/* Подсказка внизу */}
        <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
            <p className="text-white/50 text-xs animate-pulse">Нажми для паузы • Закроется автоматически</p>
        </div>
    </div>
  );
}
