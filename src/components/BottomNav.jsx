import React from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../config/constants';

export default function BottomNav() {
  const tabs = [
    { id: 'home', icon: 'home', path: ROUTES.HOME },
    { id: 'resale', icon: 'storefront', path: ROUTES.RESALE }, // <-- NEW
    { id: 'cart', icon: 'shopping_bag', isCenter: true, path: ROUTES.CART },
    { id: 'profile', icon: 'person', path: ROUTES.PROFILE }
  ];

  const handleHaptic = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  };

  return (
    <div className="fixed bottom-6 left-4 right-4 z-40 bottom-nav-container">
      <div className="glass h-16 rounded-2xl bg-[#102216]/80 backdrop-blur-xl flex items-center justify-around shadow-2xl shadow-black/50 border border-white/10">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            onClick={handleHaptic}
            className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-12 transition-colors gap-1 ${isActive ? 'text-[#13ec5b]' : 'text-white/50 hover:text-white'
              }`}
          >
            {tab.isCenter ? (
              <div className="relative">
                <span className="material-symbols-outlined text-[26px]">{tab.icon}</span>
                {/* Индикатор в центре (пока статический, потом привяжем к кол-ву товаров) */}
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#13ec5b] rounded-full"></span>
              </div>
            ) : (
              <span className="material-symbols-outlined text-[26px]">{tab.icon}</span>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}