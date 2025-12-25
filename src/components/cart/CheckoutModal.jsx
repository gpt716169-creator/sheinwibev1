import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AddressBlock from './AddressBlock';
import { API_BASE_URL } from '../../config/constants';

// Ссылка на оферту
const OFFER_LINK = window.location.origin + '/offer.pdf';

export default function CheckoutModal({
    onClose, user, dbUser, total, items, pointsUsed, couponDiscount, activeCoupon,
    // Пропсы
    addresses, deliveryMethod, setDeliveryMethod,
    selectedAddress, setSelectedAddress,
    selectedPvz, setSelectedPvz,
    onManageAddresses
}) {

    // Форма существует в памяти, но скрыта от глаз
    const [form, setForm] = useState({ name: '', phone: '', email: '', agreed: false, customsAgreed: false });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => document.body.style.overflow = 'auto';
    }, []);

    // АВТОЗАПОЛНЕНИЕ (Скрытое)
    const handleAddressSelect = (addr) => {
        if (addr) {
            setForm(prev => ({
                ...prev,
                name: addr.full_name || prev.name,
                phone: addr.phone || prev.phone,
                email: addr.email || prev.email
            }));
        }
    };

    const handlePay = async () => {
        // 1. Проверки
        if (deliveryMethod === 'ПВЗ (5Post)' && !selectedPvz) {
            window.Telegram?.WebApp?.showAlert('Выберите магазин 5Post'); return;
        }
        if (deliveryMethod !== 'ПВЗ (5Post)' && !selectedAddress) {
            window.Telegram?.WebApp?.showAlert('Выберите адрес доставки'); return;
        }
        if (!form.name || form.name.length < 2 || !form.phone) {
            window.Telegram?.WebApp?.showAlert('Заполните контакты'); return;
        }
        if (!form.agreed || !form.customsAgreed) {
            window.Telegram?.WebApp?.showAlert('Примите оферту'); return;
        }

        // 2. Сборка адреса
        let finalAddress = '';
        let pickupInfo = null;
        let finalPostalCode = '000000';

        if (deliveryMethod === 'ПВЗ (5Post)') {
            finalAddress = `5Post: ${selectedPvz.city}, ${selectedPvz.address}`;
            const realPointId = selectedPvz.pickup_point_id || selectedPvz.id;
            const cleanId = realPointId ? String(realPointId).replace('saved_', '') : null;
            finalPostalCode = selectedPvz.postal_code || '000000';
            pickupInfo = { id: cleanId, postal_code: finalPostalCode };
        } else {
            finalAddress = [selectedAddress.region, selectedAddress.city, selectedAddress.street, selectedAddress.house, selectedAddress.flat].filter(Boolean).join(', ');
            finalPostalCode = selectedAddress.postal_code || '';
        }

        setLoading(true);
        try {
            const payload = {
                tg_id: user?.id || 1332986231, // Fallback для тестов
                user_info: {
                    name: form.name,
                    phone: form.phone,
                    email: form.email, // <--- ВАЖНО ДЛЯ ЧЕКА
                    address: finalAddress,
                    delivery_method: deliveryMethod,
                    pickup_point_id: pickupInfo?.id,
                    postal_code: finalPostalCode
                },
                items: items,
                items_total: (total + pointsUsed + couponDiscount),
                final_total: total, // Сумма к оплате
                points_used: pointsUsed,
                coupon_code: activeCoupon,
                coupon_discount: couponDiscount,
                discount_applied: pointsUsed + couponDiscount
            };

            // Отправляем запрос
            const res = await fetch(`${API_BASE_URL}/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();

            // === ГЛАВНОЕ ИСПРАВЛЕНИЕ ===
            if (json.status === 'success' && json.payment_url) {
                // НЕ показываем алерт, сразу редирект
                window.location.href = json.payment_url;
            } else {
                throw new Error(json.message || 'Ошибка сервера');
            }

        } catch (e) {
            window.Telegram?.WebApp?.showAlert('Ошибка: ' + e.message);
            setLoading(false); // Снимаем загрузку только при ошибке
        }
    };

    // Функция для открытия оферты
    const openOffer = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (window.Telegram?.WebApp?.openLink) {
            window.Telegram.WebApp.openLink(OFFER_LINK, { try_instant_view: false });
        } else {
            window.open(OFFER_LINK, '_blank');
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#101622] flex flex-col animate-slide-up" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            {/* Шапка */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#101622] shrink-0 pt-safe-top">
                <button onClick={() => onClose(false)} className="flex items-center gap-1 text-white/50 px-2 py-1 active:opacity-50">
                    <span className="material-symbols-outlined text-lg">arrow_back_ios</span><span className="text-sm">Назад</span>
                </button>
                <h2 className="text-white font-bold text-lg">Оформление</h2>
                <div className="w-16"></div>
            </div>

            {/* Контент */}
            <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-6">

                <section className="space-y-3">
                    <h3 className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Куда доставить?</h3>
                    <AddressBlock
                        deliveryMethod={deliveryMethod} setDeliveryMethod={setDeliveryMethod}
                        addresses={addresses}
                        selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress}
                        selectedPvz={selectedPvz} setSelectedPvz={setSelectedPvz}
                        onManageAddresses={onManageAddresses}
                        onFillFromAddress={handleAddressSelect}
                    />
                </section>

                <section className="space-y-3 pt-2">
                    <label className="flex gap-3 items-center cursor-pointer group select-none">
                        <input
                            type="checkbox"
                            checked={form.agreed}
                            onChange={e => setForm({ ...form, agreed: e.target.checked })}
                            className="w-5 h-5 rounded border-white/30 bg-white/5 checked:bg-primary checked:border-primary appearance-none transition-colors shrink-0"
                        />
                        <span className="text-xs text-white/60 leading-tight">
                            Я согласен с условиями{' '}
                            <span
                                onClick={openOffer}
                                className="text-primary underline decoration-primary/50 underline-offset-2 hover:text-primary/80 transition-colors"
                            >
                                публичной оферты
                            </span>
                        </span>
                    </label>
                    <label className="flex gap-3 items-center cursor-pointer group select-none">
                        <input
                            type="checkbox"
                            checked={form.customsAgreed}
                            onChange={e => setForm({ ...form, customsAgreed: e.target.checked })}
                            className="w-5 h-5 rounded border-white/30 bg-white/5 checked:bg-primary checked:border-primary appearance-none transition-colors shrink-0"
                        />
                        <span className="text-xs text-white/60 leading-tight">Предоставлю данные для таможни</span>
                    </label>
                </section>
            </div>

            {/* Кнопка Оплаты */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#101622] border-t border-white/5 pb-safe-bottom z-20">
                <button onClick={handlePay} disabled={loading} className="w-full h-14 bg-primary text-[#102216] font-black rounded-xl text-lg uppercase shadow-[0_0_20px_rgba(19,236,91,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2">
                    {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : `Оплатить ${total.toLocaleString()} ₽`}
                </button>
            </div>
        </div>,
        document.body
    );
}
