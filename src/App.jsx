import { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Profile from './pages/Profile';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  // tgUser - данные от Телеграма (ID, Username)
  const [tgUser, setTgUser] = useState(null);
  // dbUser - данные из нашей Базы (Баллы, Статус, Адрес)
  const [dbUser, setDbUser] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.enableClosingConfirmation();
      
      const user = tg.initDataUnsafe?.user || { 
        id: 1332986231, 
        first_name: "Konstantin (Dev)", 
        username: "browser_test" 
      };
      setTgUser(user);

      // Сразу загружаем данные из базы при старте
      initUserInDB(user);
      
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

  const initUserInDB = async (userData) => {
    try {
        const res = await fetch('https://proshein.com/webhook/init-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tg_id: userData.id,
                first_name: userData.first_name,
                username: userData.username
            })
        });
        const json = await res.json();
        if (json.status === 'success') {
            // Сохраняем полные данные о юзере (включая баллы)
            setDbUser(json.data);
        }
    } catch (e) {
        console.error("Ошибка авторизации:", e);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-gradient text-white overflow-hidden font-display">
      <div className="fixed inset-0 pointer-events-none bg-luxury-gradient z-0"></div>

      <div className="relative z-10 pb-24">
        {/* Передаем dbUser во все компоненты, чтобы везде были актуальные баллы */}
        {activeTab === 'home' && <Home user={tgUser} dbUser={dbUser} setActiveTab={setActiveTab} />}
        {activeTab === 'cart' && <Cart user={tgUser} dbUser={dbUser} setActiveTab={setActiveTab} />}
        {activeTab === 'profile' && <Profile user={tgUser} dbUser={dbUser} />}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
