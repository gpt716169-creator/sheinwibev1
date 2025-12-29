import React, { useState } from 'react';
import ResaleItemModal from '../components/resale/ResaleItemModal';
import AddResaleItemModal from '../components/resale/AddResaleItemModal';

// --- MOCK DATA ---
const MOCK_ITEMS = [
    {
        id: 1,
        image_url: 'https://img.ltwebstatic.com/images3_pi/2023/10/24/8c/16981297893af9640c6622ec928f64245604106518_thumbnail_405x552.webp',
        title: 'Платье с цветочным принтом',
        price: 1200,
        original_price: 1800,
        size: 'S',
        color: 'Multicolor',
        condition: 'Новое с биркой',
        description: 'Заказывала себе, но не подошел размер. Абсолютно новое, очень легкое и приятное к телу.',
        delivery_info: 'СДЭК или личная встреча в Москве (м. Киевская)',
        seller_tg: 'durov'
    },
    {
        id: 2,
        image_url: 'https://img.ltwebstatic.com/images3_pi/2023/11/15/22/17000407639f4007963283258814736f8902525488_thumbnail_405x552.webp',
        title: 'Топ корсетного типа',
        price: 850,
        original_price: 1300,
        size: 'M',
        color: 'Black',
        condition: 'Надевалось один раз',
        description: 'Надевала один раз на фотосессию. Состояние идеальное.',
        delivery_info: 'Авито доставка / Почта России',
        seller_tg: 'example_user'
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
                    <h1 className="text-white text-lg font-medium">Маркет</h1>
                    <p className="text-white/40 text-xs">Перепродажа вещей Shein</p>
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
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                                <span className="text-white font-bold text-xs">{item.price} ₽</span>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-3">
                            <h3 className="text-white text-xs font-medium line-clamp-2 min-h-[2.5em]">{item.title}</h3>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-white/40 text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{item.size}</span>
                                <span className="text-white/30 text-[10px] line-through decoration-white/30">{item.original_price} ₽</span>
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
