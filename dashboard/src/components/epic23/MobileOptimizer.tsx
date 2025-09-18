import React, { useState, useEffect, ReactNode, useRef } from 'react';

interface MobileOptimizerProps {
  children: ReactNode;
}

const MobileOptimizer: React.FC<MobileOptimizerProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Proper media query hook
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    setIsMobile(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      setStartX(touch.clientX);
      setIsSwiping(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;
      e.preventDefault();
      const touch = e.touches[0];
      const currentX = touch.clientX;
      const diff = startX - currentX;

      if (Math.abs(diff) > 100) {
        // Swipe left: next, right: back
        if (diff > 0) {
          // Swipe left - next action
          console.log('Swipe left - Navigate next');
        } else {
          // Swipe right - back action
          console.log('Swipe right - Navigate back');
        }
        setIsSwiping(false);
      }
    };

    const handleTouchEnd = () => {
      setIsSwiping(false);
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startX, isSwiping]);

  // Caching logic (from previous)
  const handleCache = async (data: any) => {
    if (isMobile) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
      }
      // Basic caching with Cache API
      caches.open('propertyAI-cache').then(cache => {
        // Cache example API response (integrate with actual fetches in children)
        fetch('/api/predictive-maintenance').then(response => response.clone()).then(res => {
          cache.put('/api/predictive-maintenance', res);
        });
      });
      // IndexedDB caching
      const request = indexedDB.open('propertyAI', 1);
      request.onsuccess = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        store.put(data, 'dashboardData');
      };
    }
  };

  return (
    <div ref={ref} className={`min-h-screen ${isMobile ? 'bg-gray-100 p-2' : 'bg-white'}`}>
      {isMobile ? (
        <div className="container mx-auto">
          <div className="grid grid-cols-1 gap-4 p-4">
            {children}
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-6">
          {children}
        </div>
      )}
    </div>
  );
};

export default MobileOptimizer;