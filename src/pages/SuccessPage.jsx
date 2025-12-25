import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/constants';

export default function SuccessPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Показываем Telegram Alert сразу
        window.Telegram?.WebApp?.showAlert("Оплата прошла успешно! Ваш заказ принят в работу.");

        // Вибрация успеха
        window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');

        // Через 3 секунды редирект в профиль
        const timer = setTimeout(() => {
            navigate(ROUTES.PROFILE, { replace: true });
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-luxury-gradient text-white p-6 text-center animate-fade-in">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(19,236,91,0.3)]">
                <span className="material-symbols-outlined text-5xl text-primary">check_circle</span>
            </div>

            <h1 className="text-2xl font-bold mb-2">Оплата прошла успешно!</h1>
            <p className="text-white/60 text-sm mb-8">Спасибо за заказ. Сейчас мы перенаправим вас в профиль...</p>

            <button
                onClick={() => navigate(ROUTES.PROFILE, { replace: true })}
                className="bg-primary text-[#102216] px-8 py-3 rounded-xl font-bold uppercase tracking-wider"
            >
                Перейти в профиль
            </button>
        </div>
    );
}
