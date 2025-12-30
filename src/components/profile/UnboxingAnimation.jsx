import React, { useState, useEffect } from 'react';

export default function UnboxingAnimation({ onClose }) {
    const [shakeCount, setShakeCount] = useState(0);
    const [isOpened, setIsOpened] = useState(false);

    // Эмуляция звука "тряски одежды" через вибрацию
    const triggerShake = () => {
        window.Telegram?.WebApp?.HapticFeedback.impactOccurred('heavy');
        setShakeCount(prev => prev + 1);

        // Пасхалка: звук можно проиграть через Audio, но файлы надо грузить. 
        // Обойдемся качественной вибрацией ритмом.
    };

    useEffect(() => {
        // Открываем коробку после 5 встряхиваний
        if (shakeCount >= 5 && !isOpened) {
            setIsOpened(true);
            window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
            setTimeout(onClose, 2500); // Закрываем через 2.5с после анимации
        }
    }, [shakeCount]);

    // Детектор тряски телефона (DeviceMotion)
    useEffect(() => {
        const handleMotion = (event) => {
            const acc = event.acceleration;
            if (!acc) return;

            const totalAcc = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
            if (totalAcc > 20) { // Порог чувствительности
                triggerShake();
            }
        };

        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', handleMotion);
        }

        return () => {
            if (window.DeviceMotionEvent) {
                window.removeEventListener('devicemotion', handleMotion);
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100000] bg-black/90 flex flex-col items-center justify-center animate-fade-in" onClick={triggerShake}>

            {!isOpened ? (
                <div className={`relative w-64 h-64 transition-transform duration-100 ${shakeCount > 0 ? 'animate-wiggle' : ''}`}>

                    {/* КОРОБКА (CSS 3D) */}
                    <div className="w-full h-full bg-[#d4a373] rounded-xl flex items-center justify-center shadow-2xl relative overflow-hidden border-4 border-[#bc8a5f]">
                        {/* Лента */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 bg-red-600 shadow-sm z-10"></div>
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-12 bg-red-600 shadow-sm z-10"></div>

                        {/* Текст */}
                        <div className="z-20 bg-white/90 px-4 py-2 rounded shadow rotate-[-5deg]">
                            <span className="text-black font-black text-xl uppercase tracking-widest">SHEINWIBE</span>
                        </div>

                        {/* Стикер */}
                        <div className="absolute top-4 right-4 w-16 h-16 bg-white rotate-12 shadow flex items-center justify-center text-[10px] font-mono p-1 text-center leading-none text-black/60">
                            FRAGILE
                        </div>
                    </div>

                    {/* Инструкция */}
                    <div className="absolute -bottom-20 left-0 right-0 text-center animate-pulse">
                        <p className="text-white font-bold text-lg">Потряси телефон! 📳</p>
                        <p className="text-white/50 text-xs mt-1">Чтобы услышать шуршание</p>
                        <div className="text-4xl mt-2">👋📱</div>
                    </div>
                </div>
            ) : (
                <div className="text-center animate-scale-in relative">
                    <div className="text-6xl mb-4 animate-bounce">✨👗✨</div>
                    <h2 className="text-white text-3xl font-black uppercase italic">Распаковано!</h2>
                    <p className="text-white/60 mt-2">Ваш заказ готов к примерке</p>

                    {/* Конфетти (CSS particles) */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="absolute animate-[fall_3s_infinite]" style={{
                                left: `${Math.random() * 100}%`,
                                top: `-${Math.random() * 20}%`,
                                animationDelay: `${Math.random()}s`,
                                fontSize: '20px'
                            }}>
                                {['🎉', '🎊', '✨', '💖'][Math.floor(Math.random() * 4)]}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Кнопка выхода (на всякий случай) */}
            <button onClick={onClose} className="absolute top-10 right-6 text-white/30 p-2">
                <span className="material-symbols-outlined">close</span>
            </button>

            <style>{`
            @keyframes wiggle {
                0%, 100% { transform: rotate(-3deg); }
                50% { transform: rotate(3deg); }
            }
            .animate-wiggle {
                animation: wiggle 0.1s linear infinite;
            }
        `}</style>

        </div>
    );
}
