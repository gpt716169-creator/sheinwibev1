import React from 'react';

const ACHIEVEMENTS = [
    {
        id: 'newbie',
        icon: 'person',
        title: 'Новичок',
        desc: 'Зарегистрироваться в приложении',
        unlocked: true,
        progress: 100,
        reward: '5 баллов'
    },
    {
        id: 'first_order',
        icon: 'shopping_bag',
        title: 'Первый заказ',
        desc: 'Оформить любой заказ',
        unlocked: true,
        progress: 100,
        reward: '10 баллов'
    },
    {
        id: 'review_master',
        icon: 'rate_review',
        title: 'Критик',
        desc: 'Оставить 5 отзывов',
        unlocked: false,
        progress: 20, // 1/5
        reward: '50 баллов'
    },
    {
        id: 'swipe_king',
        icon: 'favorite',
        title: 'Король лайков',
        desc: 'Лайкнуть 100 товаров в свайп-моде',
        unlocked: false,
        progress: 45,
        reward: 'Стикерпак'
    },
    {
        id: 'shopaholic',
        icon: 'diamond',
        title: 'Шопоголик',
        desc: 'Потратить 50 000 ₽',
        unlocked: false,
        progress: 15,
        reward: 'Статус Gold'
    }
];

export default function AchievementsTab() {
    return (
        <div className="px-6 pb-32 animate-fade-in">
            {/* Header Stats */}
            <div className="bg-gradient-to-r from-[#1c2636] to-[#151c28] p-4 rounded-2xl border border-white/5 mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider">Открыто</h3>
                    <p className="text-white text-2xl font-black">2 / 5</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-yellow-500 text-2xl">emoji_events</span>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {ACHIEVEMENTS.map(ach => (
                    <div
                        key={ach.id}
                        className={`relative rounded-xl p-4 border transition-all ${ach.unlocked
                            ? 'bg-[#1c2636] border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                            : 'bg-white/5 border-white/5 grayscale opacity-70'}`}
                    >
                        <div className="flex gap-4">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${ach.unlocked ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-[#102216]' : 'bg-white/10 text-white/30'}`}>
                                <span className="material-symbols-outlined text-2xl">{ach.icon}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-bold ${ach.unlocked ? 'text-white' : 'text-white/50'}`}>{ach.title}</h4>
                                    {ach.unlocked && <span className="material-symbols-outlined text-yellow-500 text-lg">check_circle</span>}
                                </div>
                                <p className="text-xs text-white/50 mt-0.5">{ach.desc}</p>

                                {/* Reward */}
                                <div className="mt-2 flex items-center gap-1">
                                    <span className="text-[10px] text-white/30 uppercase font-bold">Награда:</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ach.unlocked ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/40'}`}>
                                        {ach.reward}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                {!ach.unlocked && (
                                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all rounded-full"
                                            style={{ width: `${ach.progress}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
