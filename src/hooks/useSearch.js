import { useState } from 'react';
import { API_BASE_URL } from '../config/constants';

export function useSearch(userId) {
    const [loading, setLoading] = useState(false);

    const handleSearch = async (link) => {
        setLoading(true);
        window.Telegram?.WebApp?.MainButton.showProgress();
        try {
            const res = await fetch(`${API_BASE_URL}/parse-item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ link, tg_id: userId })
            });
            const json = await res.json();

            if (json.status === 'success') {
                window.Telegram?.WebApp?.HapticFeedback.notificationOccurred('success');
                window.Telegram?.WebApp?.showAlert('Товар добавлен в корзину!');
                return true;
            } else {
                window.Telegram?.WebApp?.showAlert('Ошибка: Не удалось найти товар');
                return false;
            }
        } catch (e) {
            window.Telegram?.WebApp?.showAlert('Ошибка сети');
            return false;
        } finally {
            window.Telegram?.WebApp?.MainButton.hideProgress();
            setLoading(false);
        }
    };

    return { handleSearch, loading };
}
