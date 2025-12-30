import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const PRIZES = [
    { id: 1, label: '5 Баллов', value: '5_points', color: '#FFD700', text: '#000' },
    { id: 2, label: 'Скидка 3%', value: 'discount_3', color: '#102216', text: '#fff' },
    { id: 3, label: 'Секретный', value: 'secret_item', color: '#FF0055', text: '#fff' },
    { id: 4, label: '10 Баллов', value: '10_points', color: '#13ec5b', text: '#000' },
    { id: 5, label: 'Пусто ☹️', value: 'nothing', color: '#555', text: '#fff' },
    { id: 6, label: '5 Баллов', value: '5_points', color: '#FFD700', text: '#000' },
];

export default function DailySpinModal({ onClose, onWin }) {
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [prize, setPrize] = useState(null);
    const [canSpin, setCanSpin] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    const wheelRef = useRef(null);

    // Проверка времени (Cooldown 24 часа)
    useEffect(() => {
        const lastSpin = localStorage.getItem('last_spin_time');
        if (lastSpin) {
            const diff = Date.now() - parseInt(lastSpin);
            const day = 24 * 60 * 60 * 1000;

            if (diff < day) {
                setCanSpin(false);
                const hoursLeft = Math.ceil((day - diff) / (1000 * 60 * 60));
                setTimeLeft(`${hoursLeft} ч.`);
            } else {
                setCanSpin(true);
            }
        } else {
            setCanSpin(true);
        }

        document.body.style.overflow = 'hidden';
        return () => document.body.style.overflow = 'auto';
    }, []);

    const spinWheel = () => {
        if (!canSpin || spinning) return;

        setSpinning(true);
        window.Telegram?.WebApp?.HapticFeedback.impactOccurred('medium');

        // Логика выбора приза (подкрученная немного, чтобы чаще выпадали баллы, а не пусто)
        // Рандом от 0 до 5
        // Сделаем так: 0, 3, 5 (баллы) - 60%
        // 1 (скидка) - 20%
        // 2 (секрет) - 5%
        // 4 (пусто) - 15%

        // Но для простоты пока честный рандом
        const winningIndex = Math.floor(Math.random() * PRIZES.length);
        const segmentAngle = 360 / PRIZES.length;

        // Вычисляем угол:
        // Нужно сделать минимум 5 полных оборотов (360 * 5)
        // + угол, чтобы стрелка (сверху, 0deg) указала на нужный сегмент
        // Стрелка указывает на ВЕРХ. Начало колеса тоже ВЕРХ.
        // Если winningIndex = 0 (первый сегмент), он от -30 до +30 (условно).
        // Повернем так, чтобы центр сегмента был наверху.

        // Сдвиг сегмента (чтобы стрелка попала в центр)
        // Prize N находится на углу N * segmentAngle. Чтобы он оказался наверху (0), нужно повернуть колесо на - (N * segmentAngle).

        const randomOffset = Math.floor(Math.random() * 20) - 10; // Немного шума +/- 10 градусов
        const targetRotation = 360 * 5 + (360 - (winningIndex * segmentAngle)) + randomOffset;

        setRotation(targetRotation);

        // Звук вращения (тик-тик) можно симулировать хаптикой в интервале, но это сложно синхронизировать.
        // Просто сделаем финальный удар

        setTimeout(() => {
            setSpinning(false);
            setPrize(PRIZES[winningIndex]);
            localStorage.setItem('last_spin_time', Date.now().toString());
            setCanSpin(false);

            window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');

            // Callback родителю, чтобы начислить баллы
            if (onWin) onWin(PRIZES[winningIndex]);

        }, 4000); // 4 секунды анимации
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">

            <div className="relative w-full max-w-sm flex flex-col items-center">

                {/* Заголовок */}
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-black text-white uppercase tracking-wider italic drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                        <span className="text-[#FFD700]">Wheel</span> of Fortune
                    </h2>
                    <p className="text-white/50 text-xs mt-2">Крути и выигрывай каждый день!</p>
                </div>

                {/* Колесо */}
                <div className="relative w-64 h-64 mb-8">
                    {/* Стрелка */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-8 h-10 flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full bg-white shadow-lg z-10"></div>
                        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white -mt-2"></div>
                    </div>

                    {/* Круг колеса */}
                    <div
                        className="w-full h-full rounded-full border-4 border-white/20 relative overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.2)] bg-[#1c2636]"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: spinning ? 'transform 4s cubic-bezier(0.1, 0.05, 0.2, 1)' : 'none'
                        }}
                    >
                        {PRIZES.map((p, i) => (
                            <div
                                key={i}
                                className="absolute w-[50%] h-[50%] top-0 right-0 origin-bottom-left flex items-center justify-center"
                                style={{
                                    transform: `rotate(${i * (360 / PRIZES.length)}deg) skewY(-${90 - (360 / PRIZES.length)}deg)`,
                                    background: p.color,
                                    borderLeft: '1px solid rgba(0,0,0,0.1)'
                                }}
                            >
                                <span
                                    className="absolute"
                                    style={{
                                        transform: `skewY(${90 - (360 / PRIZES.length)}deg) rotate(${360 / PRIZES.length / 2}deg) translate(40px, 0)`,
                                        color: p.text,
                                        fontWeight: 'bold',
                                        fontSize: '10px',
                                        textAlign: 'center',
                                        width: '60px'
                                    }}
                                >
                                    {p.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Центр */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border-4 border-[#1c2636] flex items-center justify-center font-bold text-[#1c2636] text-[10px] shadow-lg z-10">
                        SPIN
                    </div>
                </div>

                {/* Кнопка или Результат */}
                {!prize ? (
                    <button
                        onClick={spinWheel}
                        disabled={!canSpin}
                        className={`w-40 h-12 rounded-xl font-bold uppercase tracking-wider shadow-lg transition-transform ${canSpin
                            ? 'bg-[#FFD700] text-black active:scale-95 hover:bg-[#FFE550]'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                    >
                        {canSpin ? 'КРУТИТЬ' : timeLeft}
                    </button>
                ) : (
                    <div className="bg-[#1c2636] border border-white/10 p-4 rounded-2xl text-center animate-scale-in w-full">
                        <p className="text-white/60 text-xs uppercase mb-1">Вы выиграли:</p>
                        <h3 className="text-xl font-black text-[#13ec5b] mb-4">{prize.label}</h3>
                        <button onClick={onClose} className="w-full py-2 bg-white/10 rounded-lg text-white font-bold text-sm">
                            Забрать
                        </button>
                    </div>
                )}

                {!prize && !canSpin && (
                    <button onClick={onClose} className="mt-6 text-white/30 text-xs underline">
                        Закрыть
                    </button>
                )}

            </div>
        </div>,
        document.body
    );
}
