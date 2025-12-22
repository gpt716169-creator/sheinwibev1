import { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Profile from './pages/Profile';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [tgUser, setTgUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);

  // --- ЛОГИКА ПРОКРУТКИ НАВЕРХ ---
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // --- НОВОЕ: ПРОВЕРКА ВОЗВРАТА С ОПЛАТЫ ---
  useEffect(() => {
      // Читаем параметры из адресной строки (куда нас вернула Робокасса)
      const params = new URLSearchParams(window.location.search);
      const status = params.get('payment');

      if (status === 'success') {
          // 1. Показываем сообщение
          window.Telegram?.WebApp?.showAlert("Оплата прошла успешно! Ваш заказ принят в работу.");
          // 2. Перекидываем в профиль (чтобы юзер увидел свой новый заказ в списке)
          setActiveTab('profile');
          // 3. Чистим URL, чтобы убрать "?payment=success" (красота)
          window.history.replaceState(null, '', window.location.pathname);
      } 
      else if (status === 'fail') {
          window.Telegram?.WebApp?.showAlert("Оплата не прошла или была отменена.");
          // Можно оставить на главной или отправить в корзину
          setActiveTab('cart'); 
          window.history.replaceState(null, '', window.location.pathname);
      }
  }, []);
  // ------------------------------------------

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
      }

      // Хак для клавиатуры
      const handleFocus = () => document.body.classList.add('keyboard-open');
      const handleBlur = () => document.body.classList.remove('keyboard-open');
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', handleFocus);
        input.addEventListener('blur', handleBlur);
      });
    }
  }, []);

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
    }
  };

  const handleRefreshData = () => {
      if (tgUser) {
          initUserInDB(tgUser, null); 
      }
  };

  return (
    <div className="min-h-screen bg-luxury-gradient text-white overflow-hidden font-display">
      <div className="fixed inset-0 pointer-events-none bg-luxury-gradient z-0"></div>

      <div className="relative z-10 pb-24">
        {activeTab === 'home' && <Home user={tgUser} dbUser={dbUser} setActiveTab={setActiveTab} />}
        
        {activeTab === 'cart' && (
            <Cart 
                user={tgUser} 
                dbUser={dbUser} 
                setActiveTab={setActiveTab} 
                onRefreshData={handleRefreshData} 
            />
        )}
        
        {activeTab === 'profile' && <Profile user={tgUser} dbUser={dbUser} />}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
