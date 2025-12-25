import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import SuccessPage from './pages/SuccessPage'; // Импортируем новую страницу
import { ROUTES } from './config/constants';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- ЛОГИКА ПРОКРУТКИ НАВЕРХ ---
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Мы УБРАЛИ useEffect с редиректом отсюда полностью.
  // Теперь логика находится внутри самих компонентов SuccessPage и (по аналогии) FailPage.

  return (
    <div className="min-h-screen bg-luxury-gradient text-white overflow-hidden font-display">
      <div className="fixed inset-0 pointer-events-none bg-luxury-gradient z-0"></div>

      <div className="relative z-10 pb-24">
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.CART} element={<Cart />} />
          <Route path={ROUTES.PROFILE} element={<Profile />} />

          {/* Используем полноценный компонент */}
          <Route path={ROUTES.SUCCESS} element={<SuccessPage />} />

          {/* Для ошибки можно оставить пока простую заглушку или тоже сделать компонент */}
          <Route path={ROUTES.FAIL} element={
            <div className="flex flex-col items-center justify-center h-screen text-center p-6">
              <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
              <h1 className="text-xl font-bold mb-2">Оплата не прошла</h1>
              <button onClick={() => navigate(ROUTES.CART)} className="mt-4 bg-white/10 px-6 py-2 rounded-lg">Вернуться в корзину</button>
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
