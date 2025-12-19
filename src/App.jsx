const initUserInDB = async (userData, refCode) => {
    if (!userData || !userData.id) return;

    try {
        const res = await fetch('https://proshein.com/webhook/init-user', {
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

        // --- 🚨 ДЕБАГ: ПОКАЖИ МНЕ ДАННЫЕ! ---
        // Это окно покажет точную структуру, которую видит телефон
        window.Telegram.WebApp.showAlert(
            "RAW DATA:\n" + JSON.stringify(json, null, 2).substring(0, 300)
        );
        // ------------------------------------
        
        // Попытка угадать структуру (проверка двух вариантов)
        let finalUser = null;

        // Вариант 1: n8n вернул { status: 'success', data: [...] }
        if (json.data) {
             finalUser = Array.isArray(json.data) ? json.data[0] : json.data;
        } 
        // Вариант 2: n8n вернул просто массив [...] без обертки
        else if (Array.isArray(json)) {
             finalUser = json[0];
        }
        // Вариант 3: n8n вернул чистый объект {...}
        else {
             finalUser = json;
        }

        if (finalUser) {
            setDbUser(finalUser);
        } else {
            window.Telegram.WebApp.showAlert("Ошибка: Данные юзера не найдены внутри JSON");
        }

    } catch (e) {
        window.Telegram.WebApp.showAlert("Ошибка fetch: " + e.message);
    }
  };
