import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CartItem from '../components/cart/CartItem';
import PaymentBlock from '../components/cart/PaymentBlock';
import FullScreenVideo from '../components/ui/FullScreenVideo';
import EditItemModal from '../components/cart/EditItemModal';
import CheckoutModal from '../components/cart/CheckoutModal';
import CouponModal from '../components/cart/CouponModal';
import { supabase } from '../supabaseClient';
import { ROUTES } from '../config/constants';
import { useAppContext } from '../context/AppContext';

export default function Cart() {
    const { tgUser: user, dbUser, refreshUser } = useAppContext();
    const navigate = useNavigate();
    // --- STATE: DATA ---
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // === НОВОЕ: ID выбранных товаров ===
    const [selectedIds, setSelectedIds] = useState([]);

    // --- STATE: ADDRESS & DELIVERY ---
    const [addresses, setAddresses] = useState([]);
    const [deliveryMethod, setDeliveryMethod] = useState('ПВЗ (5Post)');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [selectedPvz, setSelectedPvz] = useState(null);

    // --- STATE: DISCOUNTS ---
    const [pointsInput, setPointsInput] = useState('');
    const [activeCoupon, setActiveCoupon] = useState(null);
    const [couponDiscount, setCouponDiscount] = useState(0);

    // --- STATE: UI ---
    const [showCheckout, setShowCheckout] = useState(false);
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [savingItem, setSavingItem] = useState(false);
    const [videoOpen, setVideoOpen] = useState(false);

    // CONSTANTS
    const VIDEO_URL = "https://storage.yandexcloud.net/videosheinwibe/vkclips_20251219083418.mp4";

    // НАСТРОЙКИ ОГРАНИЧЕНИЙ
    const MIN_ORDER_AMOUNT = 3000;       // Минимальная сумма заказа
    const MAX_TOTAL_DISCOUNT_PERCENT = 0.50; // Максимальная общая скидка (Купон + Баллы) = 50%

    const userPointsBalance = dbUser?.points || 0;

    // --- LOAD DATA ---
    useEffect(() => {
        if (user?.id) {
            loadCart();
            loadAddresses();
        } else {
            const t = setTimeout(() => setLoading(false), 2000);
            return () => clearTimeout(t);
        }
    }, [user]);

    // === НОВОЕ: Авто-выбор товаров при загрузке ===
    // Если список товаров изменился (загрузился), выбираем доступные, если список выбранных пуст
    useEffect(() => {
        if (items.length > 0) {
            setSelectedIds(prev => {
                // Находим все доступные ID (есть в наличии)
                const availableIds = items
                    .filter(i => i.is_in_stock !== false)
                    .map(i => i.id);

                // Если раньше ничего не было выбрано (первая загрузка), выбираем все доступные
                if (prev.length === 0) return availableIds;

                // Если уже были выбраны, оставляем только те, что всё еще доступны и есть в списке items
                // (чтобы убрать удаленные или те, что пропали из наличия)
                return prev.filter(id => availableIds.includes(id));
            });
        }
    }, [items]);

    const loadCart = async () => {
        setLoading(true);
        try {
            // 1. Прямой запрос в базу (Мгновенно)
            // Предлагаю создать view (представление) в Supabase или делать join, 
            // но для начала можно просто select, если у тебя cart_items хранит всю инфу.
            // Если cart_items ссылается на products, нужен join.

            // Допустим, у тебя cart_items содержит копию данных (как в твоем старом вебхуке)
            const { data, error } = await supabase
                .from('cart_items')
                .select('*')
                .eq('telegram_id', user?.id);

            if (error) throw error;

            // Превращаем данные в нужный формат
            const formattedItems = (data || []).map(i => ({
                ...i,
                quantity: Number(i.quantity) || 1,
                final_price_rub: Number(i.final_price_rub) || 0,
                // Важно: пока база не обновится, берем старый статус
                is_in_stock: i.is_in_stock !== false
            }));

            setItems(formattedItems);

            // 2. ЗАПУСКАЕМ ФОНОВУЮ ПРОВЕРКУ (Fire and Forget)
            // Мы не ждем await, чтобы интерфейс не тупил
            if (formattedItems.length > 0) {
                checkStockBackground(formattedItems);
            }

        } catch (e) {
            console.error("Ошибка загрузки корзины:", e);
        } finally {
            setLoading(false);
        }
    };

    // Новая функция фоновой проверки
    const checkStockBackground = async (currentItems) => {
        try {
            // Берем только ID и ссылки (или shein_id), чтобы не гонять лишний трафик
            const itemsToCheck = currentItems.map(i => ({
                id: i.id,           // ID записи в корзине (чтобы обновить UI)
                product_url: i.product_url, // Ссылка для парсинга
                shein_id: i.shein_id // ID товара Shein
            }));

            const res = await fetch(`${API_BASE_URL}/check-cart-stock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: itemsToCheck })
            });

            const json = await res.json();

            // Если пришли обновления, актуализируем стейт
            if (json.updated_items && json.updated_items.length > 0) {
                setItems(prev => prev.map(item => {
                    const update = json.updated_items.find(u => u.shein_id === item.shein_id);
                    if (update) {
                        return {
                            ...item,
                            is_in_stock: update.is_in_stock
                            // Можно и цену обновить тут же, если изменилась
                        };
                    }
                    return item;
                }));
            }
        } catch (e) {
            console.error("Ошибка фоновой проверки наличия:", e);
            // Ошибку пользователю не показываем, пусть видит старые данные, чем ошибку
        }
    };

    const loadAddresses = async () => {
        try {
            const { data, error } = await supabase
                .from('user_addresses')
                .select('*, pickup_point_id')
                .eq('user_id', user?.id)
                .order('is_default', { ascending: false });

            if (error) throw error;
            setAddresses(data || []);
        } catch (e) {
            console.error("Ошибка загрузки адресов:", e);
        }
    };

    // --- ACTIONS ---

    // === НОВОЕ: Переключение выбора товара ===
    const handleToggleSelect = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id); // Убираем
            } else {
                return [...prev, id]; // Добавляем
            }
        });
    };

    const handleManageAddresses = () => {
        sessionStorage.setItem('open_profile_tab', 'addresses');
        navigate(ROUTES.PROFILE);
    };

    const handleUpdateQuantity = async (id, delta) => {
        const currentItem = items.find(i => i.id === id);
        if (!currentItem) return;

        const newQty = Math.max(1, currentItem.quantity + delta);
        if (newQty === currentItem.quantity) return;

        setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));

        try {
            await fetch(`${API_BASE_URL}/update-cart-item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    quantity: newQty,
                    size: currentItem.size,
                    color: currentItem.color,
                    tg_id: user?.id
                })
            });
        } catch (e) {
            console.error("Ошибка сохранения количества:", e);
        }
    };

    const saveItemParams = async (id, newSize, newColor) => {
        setSavingItem(true);
        const currentItem = items.find(i => i.id === id);
        const quantity = currentItem ? currentItem.quantity : 1;
        const colorToSave = newColor || (currentItem ? currentItem.color : '');

        setItems(prev => prev.map(item =>
            item.id === id
                ? { ...item, size: newSize, color: colorToSave }
                : item
        ));

        try {
            const res = await fetch(`${API_BASE_URL}/update-cart-item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    tg_id: user?.id,
                    quantity: quantity,
                    size: newSize,
                    color: colorToSave
                })
            });
            if (!res.ok) throw new Error('Failed to update');
            window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
            setEditingItem(null);
        } catch (e) {
            console.error('Ошибка сохранения параметров:', e);
            window.Telegram?.WebApp?.showAlert('Не удалось сохранить изменения');
        } finally {
            setSavingItem(false);
        }
    };

    const handleDeleteItem = async (e, id) => {
        if (!window.confirm('Удалить товар из корзины?')) return;

        // Удаляем из списка товаров
        setItems(prev => prev.filter(i => i.id !== id));
        // Удаляем из списка выбранных, если он там был
        setSelectedIds(prev => prev.filter(selId => selId !== id));

        try {
            await fetch(`${API_BASE_URL}/delete-item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, tg_id: user?.id })
            });
        } catch (e) { console.error(e); }
    };

    // --- CALCULATIONS ---

    // === ВАЖНОЕ ИЗМЕНЕНИЕ: Считаем Subtotal ТОЛЬКО ДЛЯ ВЫБРАННЫХ ===
    const subtotal = useMemo(() => {
        return items
            .filter(i => selectedIds.includes(i.id)) // Фильтр
            .reduce((sum, i) => sum + (i.final_price_rub * i.quantity), 0);
    }, [items, selectedIds]);

    // Расчет лимитов для баллов
    const maxTotalDiscount = Math.floor(subtotal * MAX_TOTAL_DISCOUNT_PERCENT);

    const availablePointsLimit = Math.max(0, Math.min(
        userPointsBalance,
        maxTotalDiscount - couponDiscount
    ));

    const handlePointsChange = (val) => {
        let num = parseInt(val) || 0;
        if (num < 0) num = 0;

        if (num > availablePointsLimit) {
            num = availablePointsLimit;
        }
        setPointsInput(num > 0 ? num.toString() : '');
    };

    // --- ЛОГИКА КУПОНОВ ---
    const applyCoupon = (coupon) => {
        if (!coupon) {
            setActiveCoupon(null);
            setCouponDiscount(0);
            return;
        }

        if (subtotal < (coupon.min_order_amount || 0)) {
            window.Telegram?.WebApp?.showAlert(`Мин. сумма заказа для этого купона: ${coupon.min_order_amount}₽`);
            return;
        }

        let discount = 0;
        if (coupon.type === 'percent') {
            discount = Math.floor(subtotal * (coupon.discount_amount / 100));
        } else {
            discount = Number(coupon.discount_amount);
        }

        if (discount > maxTotalDiscount) discount = maxTotalDiscount;

        setCouponDiscount(discount);
        setActiveCoupon(coupon);

        if ((parseInt(pointsInput) || 0) > (maxTotalDiscount - discount)) {
            setPointsInput('');
        }

        setShowCouponModal(false);
        window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
    };

    const pointsUsed = Math.min(parseInt(pointsInput) || 0, availablePointsLimit);
    const finalTotal = Math.max(0, subtotal - couponDiscount - pointsUsed);

    // --- РАСПРЕДЕЛЕНИЕ СКИДКИ (ТОЛЬКО НА ВЫБРАННЫЕ) ---
    const itemsForCheckout = useMemo(() => {
        // 1. Берем только выбранные товары
        const selectedItems = items.filter(item => selectedIds.includes(item.id));

        const totalDiscountValue = couponDiscount + pointsUsed;

        if (totalDiscountValue <= 0) {
            return selectedItems.map(item => ({
                ...item,
                price_at_purchase: item.final_price_rub
            }));
        }

        let distributedDiscount = 0;

        return selectedItems.map((item, index) => {
            const itemTotalOriginal = item.final_price_rub * item.quantity;

            // Пропорциональная скидка по отношению к Subtotal (который тоже только от выбранных)
            let itemDiscount = Math.floor((itemTotalOriginal / subtotal) * totalDiscountValue);

            // Корректировка копеек на последнем товаре
            if (index === selectedItems.length - 1) {
                itemDiscount = totalDiscountValue - distributedDiscount;
            } else {
                distributedDiscount += itemDiscount;
            }

            const totalDiscountedPrice = itemTotalOriginal - itemDiscount;
            const unitPrice = Math.floor(totalDiscountedPrice / item.quantity);

            return {
                ...item,
                final_price_rub: unitPrice,
                price_at_purchase: unitPrice
            };
        });
    }, [items, selectedIds, subtotal, couponDiscount, pointsUsed]);


    const openCheckout = () => {
        // 0. Проверка: выбрано ли что-то?
        if (selectedIds.length === 0) {
            window.Telegram?.WebApp?.showAlert('Выберите товары для оплаты!');
            return;
        }

        // 1. Проверка размеров (только у выбранных)
        const selectedItems = items.filter(i => selectedIds.includes(i.id));
        if (selectedItems.some(i => i.size === 'NOT_SELECTED' || !i.size)) {
            window.Telegram?.WebApp?.showAlert('Выберите размер для всех отмеченных товаров!');
            return;
        }

        // 2. Проверка мин. суммы
        if (subtotal < MIN_ORDER_AMOUNT) {
            window.Telegram?.WebApp?.showAlert(`Минимальная сумма заказа: ${MIN_ORDER_AMOUNT.toLocaleString()} ₽`);
            return;
        }

        setShowCheckout(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-transparent animate-fade-in pb-32">
            <div className="p-6 pt-8 pb-4"><h1 className="text-white text-lg font-medium">Корзина ({items.length})</h1></div>

            {loading ? (
                <div className="text-center text-white/50 mt-10">Загрузка...</div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-10 opacity-50">
                    <span className="material-symbols-outlined text-4xl mb-2">shopping_basket</span>
                    <p className="text-sm">Корзина пуста</p>
                </div>
            ) : (
                <div className="px-6 space-y-4">
                    <div className="space-y-3">
                        {items.map(item => (
                            <CartItem
                                key={item.id}
                                item={item}
                                // Новые пропсы для выбора
                                isSelected={selectedIds.includes(item.id)}
                                onToggleSelect={handleToggleSelect}
                                // Старые пропсы
                                onEdit={setEditingItem}
                                onDelete={handleDeleteItem}
                                onUpdateQuantity={handleUpdateQuantity}
                            />
                        ))}
                    </div>
                    <div className="h-px bg-white/5 my-4"></div>

                    {/* Если ничего не выбрано, скрываем блок оплаты или показываем нули */}
                    {selectedIds.length > 0 ? (
                        <PaymentBlock
                            subtotal={subtotal}
                            total={finalTotal}
                            discount={couponDiscount}
                            pointsInput={pointsInput}
                            setPointsInput={handlePointsChange}
                            userPointsBalance={userPointsBalance}
                            handleUseMaxPoints={() => handlePointsChange(availablePointsLimit)}
                            activeCouponCode={activeCoupon?.code}
                            onOpenCoupons={() => setShowCouponModal(true)}
                            onPay={openCheckout}
                            onPlayVideo={() => setVideoOpen(true)}
                        />
                    ) : (
                        <div className="text-center text-white/40 py-4 text-sm bg-white/5 rounded-xl">
                            Выберите товары для расчета стоимости
                        </div>
                    )}
                </div>
            )}

            {/* --- MODALS --- */}
            {editingItem && (
                <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} onSave={saveItemParams} saving={savingItem} />
            )}

            {showCouponModal && (
                <CouponModal
                    userId={user?.id}
                    subtotal={subtotal}
                    onClose={() => setShowCouponModal(false)}
                    onApply={applyCoupon}
                    activeCouponCode={activeCoupon?.code}
                />
            )}

            {showCheckout && (
                <CheckoutModal
                    onClose={(success) => {
                        setShowCheckout(false);
                        if (success) {
                            // Удаляем из корзины только те, что купили
                            setItems(prev => prev.filter(i => !selectedIds.includes(i.id)));
                            setSelectedIds([]); // Сбрасываем выбор

                            if (refreshUser) refreshUser();
                            navigate(ROUTES.HOME);
                        }
                    }}
                    user={user} dbUser={dbUser}
                    total={finalTotal}
                    items={itemsForCheckout} // Передаем ТОЛЬКО ВЫБРАННЫЕ
                    pointsUsed={pointsUsed}
                    couponDiscount={couponDiscount} activeCoupon={activeCoupon}
                    addresses={addresses} deliveryMethod={deliveryMethod} setDeliveryMethod={setDeliveryMethod}
                    selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress}
                    selectedPvz={selectedPvz} setSelectedPvz={setSelectedPvz}
                    onManageAddresses={handleManageAddresses}
                />
            )}

            {videoOpen && <FullScreenVideo src={VIDEO_URL} onClose={() => setVideoOpen(false)} />}
        </div>
    );
}
