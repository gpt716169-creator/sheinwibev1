import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import { ROUTES } from './config/constants';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- ЛОГИКА ПРОКРУТКИ НАВЕРХ ---
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // --- НОВОЕ: ПРОВЕРКА ВОЗВРАТА С ОПЛАТЫ (ПО ПУТИ URL) ---
  useEffect(() => {
    // Читаем путь (используем window.location для доступа до инициализации роутера)
    const currentPath = window.location.pathname;

    // Используем includes, чтобы поймать /success/ или /success?id=...
    if (currentPath.includes(ROUTES.SUCCESS)) {
      window.Telegram?.WebApp?.showAlert("Оплата прошла успешно! Ваш заказ принят в работу.");

      // Задержка, чтобы дать UI время на отрисовку
      setTimeout(() => {
        navigate(ROUTES.PROFILE, { replace: true });
      }, 500);
    }
    else if (currentPath.includes(ROUTES.FAIL)) {
      window.Telegram?.WebApp?.showAlert("Оплата не прошла или была отменена.");

      setTimeout(() => {
        navigate(ROUTES.CART, { replace: true });
      }, 500);
    }
  }, []); // Запускаем один раз при старте

  return (
    <div className="min-h-screen bg-luxury-gradient text-white overflow-hidden font-display">
      <div className="fixed inset-0 pointer-events-none bg-luxury-gradient z-0"></div>

      <div className="relative z-10 pb-24">
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.CART} element={<Cart />} />
          <Route path={ROUTES.PROFILE} element={<Profile />} />
          <Route path={ROUTES.SUCCESS} element={<div className="flex items-center justify-center h-screen"><span className="loader">Обработка платежа...</span></div>} />
          <Route path={ROUTES.FAIL} element={<div className="flex items-center justify-center h-screen"><span className="loader">Обработка...</span></div>} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>

      <BottomNav />
    </div>
  );
}

export default App;
