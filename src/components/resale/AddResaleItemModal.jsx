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
        size: '',
        description: '',
        delivery_info: '' // e.g. "СДЭК", "Почта"
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        // Валидация
        if (!formData.title || !formData.price) {
            window.Telegram?.WebApp?.showAlert('Заполните название и цену');
            return;
        }

        const newItem = {
            id: Date.now(),
            image_url: 'https://img.ltwebstatic.com/images3_pi/2023/09/12/57/16945037256543b57e4e8927914480d19998103130_thumbnail_405x552.webp', // Заглушка
            title: formData.title,
            price: Number(formData.price),
            original_price: Number(formData.price) * 1.5, // Фейк
            size: formData.size || 'One Size',
            condition: 'Б/У',
            description: formData.description || 'Без описания',
            delivery_info: formData.delivery_info || 'По договоренности',
            seller_tg: window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'user'
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

                    <div className="flex gap-4">
                        <Input
                            label="Цена (₽)"
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="1500"
                        />
                        <Input
                            label="Размер"
                            name="size"
                            value={formData.size}
                            onChange={handleChange}
                            placeholder="M"
                        />
                    </div>

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
