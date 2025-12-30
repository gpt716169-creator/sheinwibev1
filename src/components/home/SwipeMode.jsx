import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

// MOCK DATA FOR SWIPE
const SWIPE_ITEMS = [
    {
        id: 101,
        image_url: 'https://img.ltwebstatic.com/images3_pi/2023/12/11/4c/170227572793288c304245607063d9171b31526732_thumbnail_600x.webp',
        title: 'Платье с пайетками',
        price: 2500,
        tags: ['Вечеринка', 'Новинка']
    },
    {
        id: 102,
        image_url: 'https://img.ltwebstatic.com/images3_pi/2023/11/20/19/17004652932f790263364239850618031441434316_thumbnail_600x.webp',
        title: 'Шуба Eco Fur',
        price: 3900,
        tags: ['Зима', 'Тепло']
    },
    {
        id: 103,
        image_url: 'https://img.ltwebstatic.com/images3_pi/2023/11/13/92/16998634591f4b88950d8847814980075556276856_thumbnail_600x.webp',
        title: 'Футболка Oversize',
        price: 1200,
        tags: ['База', 'Стиль']
    },
    {
        id: 104,
        image_url: 'https://img.ltwebstatic.com/images3_pi/2023/09/25/a7/1695623881df60840c571936336067086877119280_thumbnail_600x.webp',
        title: 'Сапоги ботфорты',
        price: 3800,
        tags: ['Обувь', 'Тренд']
    },
    {
        id: 105,
        image_url: 'https://img.ltwebstatic.com/images3_pi/2023/10/30/f0/1698646960d7037199709230571066068224536294_thumbnail_600x.webp',
        title: 'Твидовый костюм',
        price: 2900,
        tags: ['Классика', 'Офис']
    }
];

export default function SwipeMode({ onClose }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [lastDirection, setLastDirection] = useState(null);
    const [dragStart, setDragStart] = useState(null);
    const [dragOffset, setDragOffset] = useState(0);

    const currentItem = SWIPE_ITEMS[currentIndex];
    const nextItem = SWIPE_ITEMS[currentIndex + 1];

    // --- SWIPE LOGIC ---
    const handleTouchStart = (e) => {
        setDragStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
        if (!dragStart) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - dragStart;
        setDragOffset(diff);
    };

    const handleTouchEnd = () => {
        if (Math.abs(dragOffset) > 100) {
            // Swipe threshold reached
            handleSwipe(dragOffset > 0 ? 'right' : 'left');
        } else {
            // Reset position
            setDragOffset(0);
        }
        setDragStart(null);
    };

    const handleSwipe = (direction) => {
        setLastDirection(direction);
        setDragOffset(direction === 'right' ? 500 : -500); // Animate out

        // Haptic feedback
        if (direction === 'right') {
            window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
        } else {
            window.Telegram?.WebApp?.HapticFeedback.impactOccurred('light');
        }

        setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
            setDragOffset(0);
            setLastDirection(null);
        }, 300);
    };

    const handleLike = () => handleSwipe('right');
    const handleDislike = () => handleSwipe('left');

    if (!currentItem) {
        return createPortal(
            <div className="fixed inset-0 z-[99999] bg-[#101622] flex flex-col items-center justify-center p-6 animate-fade-in">
                <div className="text-6xl mb-4 animate-bounce">🔥</div>
                <h2 className="text-2xl font-black text-white text-center mb-2">Всё просмотрено!</h2>
                <p className="text-white/50 text-center mb-8">Вы оценили все новые поступления.</p>
                <div className="flex gap-4 w-full">
                    <button
                        onClick={() => setCurrentIndex(0)}
                        className="flex-1 h-14 bg-white/10 rounded-xl text-white font-bold uppercase"
                    >
                        Заново
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 h-14 bg-primary text-[#102216] rounded-xl font-bold uppercase shadow-[0_0_20px_rgba(19,236,91,0.3)]"
                    >
                        В каталог
                    </button>
                </div>
            </div>,
            document.body
        );
    }

    // Calculate rotation and opacity based on drag
    const rotation = dragOffset / 20; // 200px drag = 10deg
    const likeOpacity = Math.min(Math.max(dragOffset / 100, 0), 1);
    const nopeOpacity = Math.min(Math.max(-dragOffset / 100, 0), 1);

    return createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#101622] flex flex-col hide-scrollbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            {/* Header */}
            <div className="p-4 flex justify-between items-center z-20">
                <div className="bg-white/10 px-3 py-1 rounded-full flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    <span className="text-white font-bold text-sm">Tinder Mode</span>
                </div>
                <button onClick={onClose} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-white">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* CARD STACK */}
            <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">

                {/* NEXT CARD (Background) */}
                {nextItem && (
                    <div className="absolute w-full h-full max-w-sm bg-[#1c2636] rounded-3xl border border-white/5 p-4 scale-95 opacity-50 top-4">
                        <div className="w-full h-full bg-cover bg-center rounded-2xl grayscale" style={{ backgroundImage: `url('${nextItem.image_url}')` }}></div>
                    </div>
                )}

                {/* CURRENT CARD */}
                <div
                    className="relative w-full h-full max-w-sm bg-[#1c2636] rounded-3xl border border-white/5 overflow-hidden shadow-2xl transition-transform duration-75"
                    style={{
                        transform: `translateX(${dragOffset}px) rotate(${rotation}deg)`,
                        cursor: 'grab'
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Background Image */}
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${currentItem.image_url}')` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                    </div>

                    {/* OVERLAYS */}
                    <div className="absolute top-8 left-8 border-4 border-green-500 rounded-lg px-4 py-2 transform -rotate-12 opacity-0" style={{ opacity: likeOpacity }}>
                        <span className="text-green-500 font-black text-4xl uppercase tracking-widest">LIKE</span>
                    </div>
                    <div className="absolute top-8 right-8 border-4 border-red-500 rounded-lg px-4 py-2 transform rotate-12 opacity-0" style={{ opacity: nopeOpacity }}>
                        <span className="text-red-500 font-black text-4xl uppercase tracking-widest">NOPE</span>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 pt-20">
                        {/* Tags */}
                        <div className="flex gap-2 mb-3">
                            {currentItem.tags.map(tag => (
                                <span key={tag} className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex justify-between items-end mb-2">
                            <h2 className="text-white text-2xl font-black leading-tight max-w-[70%]">{currentItem.title}</h2>
                            <span className="text-primary text-2xl font-black">{currentItem.price} ₽</span>
                        </div>

                        <p className="text-white/60 text-sm line-clamp-2">Свайпни вправо, чтобы добавить в избранное, или влево, чтобы пропустить.</p>
                    </div>
                </div>
            </div>

            {/* ACTIONS */}
            <div className="p-8 pt-0 flex justify-center items-center gap-6 z-20">
                <button
                    onClick={handleDislike}
                    className="w-16 h-16 rounded-full bg-[#1c2636] border border-red-500/30 text-red-500 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                    <span className="material-symbols-outlined text-3xl">close</span>
                </button>

                <button
                    onClick={() => {
                        window.Telegram?.WebApp?.showAlert("Суперлайк! (В разработке)");
                        window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
                    }}
                    className="w-12 h-12 rounded-full bg-[#1c2636] border border-blue-400/30 text-blue-400 flex items-center justify-center shadow-lg active:scale-90 transition-transform mt-4"
                >
                    <span className="material-symbols-outlined text-2xl">star</span>
                </button>

                <button
                    onClick={handleLike}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-[#102216] flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.4)] active:scale-90 transition-transform"
                >
                    <span className="material-symbols-outlined text-4xl">favorite</span>
                </button>
            </div>
        </div>,
        document.body
    );
}
