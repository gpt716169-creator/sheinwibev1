import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const [tgUser, setTgUser] = useState(null);
    const [dbUser, setDbUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Безопасная проверка наличия Telegram WebApp
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;

            tg.ready();
            tg.expand();
            tg.enableClosingConfirmation();

            const user = tg.initDataUnsafe?.user;
            const startParam = tg.initDataUnsafe?.start_param;

            if (user) {
                setTgUser(user);
                initUserInDB(user, startParam);
            } else {
                setLoading(false);
            }

            // Хак для клавиатуры
            const handleFocus = () => document.body.classList.add('keyboard-open');
            const handleBlur = () => document.body.classList.remove('keyboard-open');
            const inputs = document.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('focus', handleFocus);
                input.addEventListener('blur', handleBlur);
            });
        } else {
            setLoading(false);
        }
    }, []);

    const initUserInDB = async (userData, refCode) => {
        if (!userData || !userData.id) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/init-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tg_id: userData.id,
                    first_name: userData.first_name,
                    username: userData.username,
                    language_code: userData.language_code,
                    is_premium: userData.is_premium,
                    ref_code: refCode
                })
            });

            const json = await res.json();

            let finalUser = null;
            if (json.data) {
                finalUser = Array.isArray(json.data) ? json.data[0] : json.data;
            } else if (Array.isArray(json)) {
                finalUser = json[0];
            } else {
                finalUser = json;
            }

            if (finalUser) {
                setDbUser(finalUser);
            }
        } catch (e) {
            console.error("Init Error:", e);
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = () => {
        if (tgUser) {
            initUserInDB(tgUser, null);
        }
    };

    return (
        <AppContext.Provider value={{ tgUser, dbUser, loading, refreshUser }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};
