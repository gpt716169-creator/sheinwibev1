import React, { useEffect, useState } from 'react';

const SNOWFLAKES_COUNT = 30; // Количество снежинок

export default function SnowEffect() {
    const [snowflakes, setSnowflakes] = useState([]);

    useEffect(() => {
        // Генерируем снежинки при старте
        const initialFlakes = Array.from({ length: SNOWFLAKES_COUNT }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + 'vw',
            animationDuration: (Math.random() * 5 + 5) + 's', // 5-10s
            animationDelay: (Math.random() * 5) + 's',
            opacity: Math.random() * 0.5 + 0.1,
            size: (Math.random() * 5 + 2) + 'px'
        }));
        setSnowflakes(initialFlakes);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {snowflakes.map(flake => (
                <div
                    key={flake.id}
                    className="absolute top-[-10px] bg-white rounded-full animate-snow fall"
                    style={{
                        left: flake.left,
                        width: flake.size,
                        height: flake.size,
                        opacity: flake.opacity,
                        animationDuration: flake.animationDuration,
                        animationDelay: flake.animationDelay
                    }}
                />
            ))}
            <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) translateX(0); }
          50% { transform: translateY(50vh) translateX(20px); }
          100% { transform: translateY(110vh) translateX(-20px); }
        }
        .animate-snow {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
        </div>
    );
}
