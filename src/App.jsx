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
    // Читаем путь из адресной строки (например, "/success")
    const path = window.location.pathname;

    // Проверяем на успех (учитываем возможный слеш в конце)
    if (path === ROUTES.SUCCESS || path === ROUTES.SUCCESS + '/') {
      // 1. Показываем сообщение
      window.Telegram?.WebApp?.showAlert("Оплата прошла успешно! Ваш заказ принят в работу.");

      // 2. Перекидываем в профиль
      navigate(ROUTES.PROFILE);

      // 3. Чистим URL (возвращаем на главную, чтобы при обновлении не всплывало снова)
      // В React Router лучше просто сделать replace
      navigate(ROUTES.PROFILE, { replace: true });
    }
    // Проверяем на ошибку
    else if (path === ROUTES.FAIL || path === ROUTES.FAIL + '/') {
      window.Telegram?.WebApp?.showAlert("Оплата не прошла или была отменена.");

      // Возвращаем в корзину
      navigate(ROUTES.CART);
    }
  }, []); // Оставляем пустым, так как это только при монтировании

  return (
    <div className="min-h-screen bg-luxury-gradient text-white overflow-hidden font-display">
      <div className="fixed inset-0 pointer-events-none bg-luxury-gradient z-0"></div>

      <div className="relative z-10 pb-24">
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.CART} element={<Cart />} />
          <Route path={ROUTES.PROFILE} element={<Profile />} />
        </Routes>
      </div>

      <BottomNav />
    </div>
  );
}

export default App;
