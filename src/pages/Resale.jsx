import React, { useState } from 'react';
import ResaleItemModal from '../components/resale/ResaleItemModal';
import AddResaleItemModal from '../components/resale/AddResaleItemModal';

// --- MOCK DATA (REALISTIC) ---
const MOCK_ITEMS = [
    {
        id: 1,
        // Реальное фото платья
        image_url: 'https://img.ltwebstatic.com/images3_pi/2023/12/11/4c/170227572793288c304245607063d9171b31526732_thumbnail_600x.webp',
        title: 'Вечернее платье макси с пайетками',
        price: 2500,
        original_price: 4200,
        size: 'S',
        color: 'Gold',
        condition: 'Новое с биркой',
        description: 'Шикарное платье в пол, идеально на Новый Год! Заказала два размера, этот не подошел. Абсолютно новое, даже не мерила.',
        delivery_info: 'СДЭК, Boxberry (отправлю в день оплаты)',
        city: 'Москва',
        avito_link: 'https://avito.ru',
        seller_tg: 'anna_fashion'
    },
    {
        id: 2,
        image_url: 'https://img.ltwebstatic.com/images3_pi/2023/11/20/19/17004652932f790263364239850618031441434316_thumbnail_600x.webp',
        title: 'Шуба из искусственного меха',
        price: 3900,
        original_price: 6500,
        size: 'M',
        color: 'White',
        condition: 'Идеальное',
        description: 'Очень мягкая и теплая. Надевала пару раз на выход. Выглядит как натуральная. Продаю, так как купила другую.',
        delivery_info: 'Личная встреча или курьер',
        city: 'Санкт-Петербург',
        avito_link: '',
        seller_tg: 'kristina_spb'
    },
    {
        id: 3,
        image_url: 'https://img.ltwebstatic.com/images3_pi/2023/10/30/f0/1698646960d7037199709230571066068224536294_thumbnail_600x.webp',
        title: 'Костюм твидовый (юбка + жакет)',
        price: 1800,
        original_price: 2900,
        size: 'XS',
        color: 'Pink',
        condition: 'Б/У (Хорошее)',
        description: 'Стильный костюм в стиле Шанель. Носила аккуратно один сезон. Есть небольшая затяжка на подкладке, снаружи идеал.',
        delivery_info: 'Почта России',
        city: 'Казань',
        seller_tg: 'user123'
    },
    {
        id: 4,
        image_url: 'https://img.ltwebstatic.com/images3_pi/2023/09/25/a7/1695623881df60840c571936336067086877119280_thumbnail_600x.webp',
        title: 'Сапоги ботфорты черные',
        price: 2100,
        original_price: 3800,
        size: '38',
        color: 'Black',
        condition: 'Новые',
        description: 'Не подошли в голени. Очень крутые, на шнуровке. Каблук устойчивый.',
        delivery_info: 'Авито доставка',
        city: 'Екатеринбург',
        seller_tg: 'boots_lover'
    },
    {
        id: 5,
        image_url: 'https://img.ltwebstatic.com/images3_pi/2023/10/05/1f/16964726615b3c586113854ee42fa4383c07657989_thumbnail_600x.webp',
        title: 'Сумка через плечо',
        price: 153, // Текущая ставка
        original_price: 2500,
        size: 'One Size',
        color: 'Beige',
        condition: 'Новое',
        description: 'Аукцион! Кто даст больше? Сумка супер, но мне не подошла по цвету.',
        delivery_info: 'СДЭК',
        city: 'Москва',
        seller_tg: 'auction_fan',
        is_auction: true,
        auction_end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // +3 hours
        bids_count: 12
    },
    {
        id: 6,
        image_url: 'https://img.ltwebstatic.com/images3_pi/2023/11/13/92/16998634591f4b88950d8847814980075556276856_thumbnail_600x.webp',
        title: 'Футболка оверсайз с принтом',
        price: 500,
        currency: 'WIBE',
        original_price: 1200,
        size: 'L',
        color: 'Grey',
        condition: 'Новое',
        description: 'Отдам за баллы! Коплю на скидку.',
        delivery_info: 'Личная встреча',
        city: 'Новосибирск',
        seller_tg: 'points_hunter'
    }
];

export default function Resale() {
    const [items, setItems] = useState(MOCK_ITEMS);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const handleAddItem = (newItem) => {
        setItems(prev => [newItem, ...prev]);
        setShowAddModal(false);
        window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
    };

    return (
        <div className="flex flex-col min-h-screen bg-transparent animate-fade-in pb-32">

            {/* Header */}
            <div className="p-6 pt-8 pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-white text-lg font-medium flex items-center gap-2">
                        Маркет
                        <span className="animate-spin-slow">❄️</span>
                    </h1>
                    <p className="text-white/40 text-xs">Resale • Вторая жизнь вещам</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary text-[#102216] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide shadow-[0_0_15px_rgba(19,236,91,0.3)] active:scale-95 transition-transform"
                >
                    + Продать
                </button>
            </div>

            {/* List */}
            <div className="px-4 grid grid-cols-2 gap-3">
                {items.map(item => (
                    <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="bg-[#1c2636] rounded-xl overflow-hidden border border-white/5 relative group cursor-pointer active:scale-[0.98] transition-all"
                    >
                        {/* Image */}
                        <div className="aspect-[3/4] bg-white/5 bg-cover bg-center" style={{ backgroundImage: `url('${item.image_url}')` }}>
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white/80 border border-white/10">
                                {item.city}
                            </div>

                            {/* AUCTION BADGE */}
                            {item.is_auction && (
                                <div className="absolute top-2 right-2 bg-orange-500 text-black px-2 py-0.5 rounded text-[10px] font-bold uppercase animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                                    Аукцион
                                </div>
                            )}

                            {/* PRICE TAG */}
                            <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg font-bold text-xs shadow-lg flex items-center gap-1
                                ${item.is_auction ? 'bg-orange-500 text-black' :
                                    item.currency === 'WIBE' ? 'bg-purple-600 text-white border border-white/20' : 'bg-primary text-[#102216]'}`}>

                                {item.is_auction && <span className="material-symbols-outlined text-[10px]">gavel</span>}
                                {item.currency === 'WIBE'
                                    ? <>{item.price} <span className="font-normal opacity-70">Wibe</span></>
                                    : <>{item.price} ₽</>
                                }
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-3">
                            <h3 className="text-white text-xs font-medium line-clamp-2 min-h-[2.5em]">{item.title}</h3>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-white/40 text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{item.size}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            {selectedItem && (
                <ResaleItemModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}

            {showAddModal && (
                <AddResaleItemModal
                    onClose={() => setShowAddModal(false)}
                    onSave={handleAddItem}
                />
            )}
        </div>
    );
}
