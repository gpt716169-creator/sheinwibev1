import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function AddResaleItemModal({ onClose, onSave }) {
    // Lock scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => document.body.style.overflow = 'auto';
    }, []);

    const [formData, setFormData] = useState({
        title: '',
        price: '',
        purchase_price: '', // Новое: За сколько покупали
        size: '',
        description: '',
        city: '',       // Новое: Город
        avito_link: '', // Новое: Ссылка на Авито
        delivery_info: '',
        is_auction: false,
        currency: 'RUB' // 'RUB' or 'WIBE'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        // Валидация
        if (!formData.title || !formData.price || !formData.city) {
            window.Telegram?.WebApp?.showAlert('Заполните название, цену и город!');
            return;
        }

        const newItem = {
            id: Date.now(),
            // Рандомная картинка платья для реалистичности
            image_url: 'https://img.ltwebstatic.com/images3_pi/2023/09/12/57/16945037256543b57e4e8927914480d19998103130_thumbnail_405x552.webp',
            title: formData.title,
            price: Number(formData.price),
            currency: formData.currency || 'RUB',
            original_price: formData.purchase_price ? Number(formData.purchase_price) : Number(formData.price) * 1.5,
            size: formData.size || 'One Size',
            condition: 'Б/У',
            description: formData.description || 'Без описания',
            city: formData.city,
            avito_link: formData.avito_link,
            delivery_info: formData.delivery_info || 'По договоренности',
            seller_tg: window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'user',

            // AUCTION FIELDS
            is_auction: formData.is_auction,
            auction_end_time: formData.is_auction ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null, // +24 hours
            bids_count: formData.is_auction ? 0 : null
        };

        onSave(newItem);
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex flex-col bg-[#101622] animate-slide-up"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#1a2332]">
                <button onClick={onClose} className="text-white/50 hover:text-white px-2">
                    Отмена
                </button>
                <h2 className="text-white font-bold text-lg">Продать вещь</h2>
                <div className="w-16"></div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Photo Placeholder */}
                <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-primary">add_a_photo</span>
                    <span className="text-xs text-white/50">Добавить фото (Заглушка)</span>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Название товара"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Например: Платье Shein черное"
                    />

                    <Input
                        label="Город"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Москва"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label={formData.currency === 'WIBE' ? "Цена (Баллы)" : "Цена продажи (₽)"}
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="1500"
                        />

                        <Input
                            label="Покупали за (₽)"
                            name="purchase_price"
                            type="number"
                            value={formData.purchase_price}
                            onChange={handleChange}
                            placeholder="2500"
                        />
                    </div>

                    {/* CURRENCY TOGGLE */}
                    <div className="flex gap-2">
                        <div
                            onClick={() => setFormData(p => ({ ...p, currency: 'RUB', is_auction: false }))}
                            className={`flex-1 p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${formData.currency !== 'WIBE' ? 'bg-white/10 border-white/50' : 'bg-white/5 border-white/10 opacity-50'}`}
                        >
                            <span className="text-lg font-bold">₽</span>
                            <span className="text-[10px] uppercase font-bold text-white/50">Рубли</span>
                        </div>
                        <div
                            onClick={() => setFormData(p => ({ ...p, currency: 'WIBE', is_auction: false, price: '' }))}
                            className={`flex-1 p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${formData.currency === 'WIBE' ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5 border-white/10 opacity-50'}`}
                        >
                            <span className="text-lg font-bold text-purple-400">W</span>
                            <span className="text-[10px] uppercase font-bold text-white/50">Wibe Баллы</span>
                        </div>
                    </div>

                    {/* AUCTION TOGGLE */}
                    <div
                        onClick={() => setFormData(prev => ({ ...prev, is_auction: !prev.is_auction, price: !prev.is_auction ? '1' : '' }))}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${formData.is_auction ? 'bg-orange-500/10 border-orange-500/50' : 'bg-white/5 border-white/10'}`}
                    >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${formData.is_auction ? 'bg-orange-500 border-orange-500 text-black' : 'border-white/30'}`}>
                            {formData.is_auction && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                Аукцион "с рубля" 🔥
                            </div>
                            <div className="text-[10px] text-white/50">
                                Начальная цена будет 1₽. Азарт обеспечен!
                            </div>
                        </div>
                    </div>

                    <Input
                        label="Размер"
                        name="size"
                        value={formData.size}
                        onChange={handleChange}
                        placeholder="M"
                    />

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Описание</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-[#1c2636] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-primary/50 h-24 resize-none"
                            placeholder="Опишите состояние, дефекты, причину продажи..."
                        />
                    </div>

                    <Input
                        label="Ссылка на Авито (необязательно)"
                        name="avito_link"
                        value={formData.avito_link}
                        onChange={handleChange}
                        placeholder="https://avito.ru/..."
                    />

                    <Input
                        label="Условия доставки"
                        name="delivery_info"
                        value={formData.delivery_info}
                        onChange={handleChange}
                        placeholder="СДЭК, Почта, Личная встреча"
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-[#1a2332] pb-safe-bottom">
                <button
                    onClick={handleSubmit}
                    className="w-full h-12 bg-primary text-[#102216] font-black rounded-xl text-lg uppercase shadow-[0_0_20px_rgba(19,236,91,0.3)] active:scale-95 transition-transform"
                >
                    Разместить объявление
                </button>
            </div>
        </div>,
        document.body
    );
}

function Input({ label, ...props }) {
    return (
        <div className="space-y-1 w-full">
            <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">{label}</label>
            <input
                className="w-full h-12 bg-[#1c2636] border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-primary/50"
                {...props}
            />
        </div>
    );
}
