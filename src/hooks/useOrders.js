import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';

export function useOrders(userId) {
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userId) {
            loadData();
        }
    }, [userId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/get-orders?tg_id=${userId}`);
            const json = await res.json();
            setActiveOrders(json.orders || json.items || []);
        } catch (e) {
            console.error("Err loading orders", e);
        } finally {
            setLoading(false);
        }
    };

    return { activeOrders, loading, refreshOrders: loadData };
}
