import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import SuccessPage from './pages/SuccessPage';
import { ROUTES } from './config/constants';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- ЛОГИКА ПРОКРУТКИ НАВЕРХ ---
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // --- ГЛОБАЛЬНАЯ ПРОВЕРКА РЕДИРЕКТОВ ---
  useEffect(() => {
    // 1. Проверяем обычные пути (для HashRouter это /#/success)
    // React Router сам их обработает через <Route>, но на всякий случай
    // если мы используем HashRouter, window.location.pathname всегда "/"
    // а реальный путь в window.location.hash

    // 2. Проверяем Query Parameters ( ?redirect=success )
    // Это самый надежный способ для внешних систем (Робокасса)
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect'); // ?redirect=...

    // Также проверяем старый способ через путь, если сервер отдает index.html на любой путь
    const path = window.location.pathname;

    if (redirectParam === 'success' || path.includes('/success')) {
      navigate(ROUTES.SUCCESS, { replace: true });
    }
    else if (redirectParam === 'fail' || path.includes('/fail')) {
      navigate(ROUTES.FAIL, { replace: true });
    }

  }, []);

  return (
    <div className="min-h-screen bg-luxury-gradient text-white overflow-hidden font-display">
      <div className="fixed inset-0 pointer-events-none bg-luxury-gradient z-0"></div>

      <div className="relative z-10 pb-24">
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.CART} element={<Cart />} />
          <Route path={ROUTES.PROFILE} element={<Profile />} />

          <Route path={ROUTES.SUCCESS} element={<SuccessPage />} />

          <Route path={ROUTES.FAIL} element={
            <div className="flex flex-col items-center justify-center h-screen text-center p-6 animate-fade-in">
              <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
              <h1 className="text-xl font-bold mb-2">Оплата не прошла</h1>
              <p className="text-white/50 mb-6">Возможно, средств недостаточно или операция была отменена.</p>
              <button onClick={() => navigate(ROUTES.CART)} className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition-colors">
                Вернуться в корзину
              </button>
            </div>
          } />

          <Route path="*" element={<Home />} />
        </Routes>
      </div>

      <BottomNav />
    </div>
  );
}

export default App;
