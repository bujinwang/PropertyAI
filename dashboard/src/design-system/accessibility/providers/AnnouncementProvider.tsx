// PropertyFlow AI Announcement Provider
// Global provider for managing screen reader announcements

import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react';
import { LiveRegion } from '../components';

/**
 * Announcement context interface
 */
export interface AnnouncementContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  clear: () => void;
}

/**
 * Announcement context
 */
const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

/**
 * Hook to access announcement context
 */
export const useAnnouncements = (): AnnouncementContextType => {
  const context = useContext(AnnouncementContext);
  
  if (context === undefined) {
    throw new Error(
      'useAnnouncements must be used within an AnnouncementProvider. ' +
      'Make sure your app is wrapped with <AnnouncementProvider>.'
    );
  }
  
  return context;
};

/**
 * Provider props
 */
export interface AnnouncementProviderProps {
  children: ReactNode;
}

/**
 * Global announcement provider component
 * 
 * Provides a centralized way to make screen reader announcements
 * throughout the application. Creates live regions that are used
 * to announce dynamic content changes.
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AnnouncementProvider>
 *       <YourApp />
 *     </AnnouncementProvider>
 *   );
 * }
 * 
 * function SomeComponent() {
 *   const { announce } = useAnnouncements();
 * 
 *   const handleSave = () => {
 *     // Save data...
 *     announce('Property saved successfully');
 *   };
 * 
 *   return <Button onClick={handleSave}>Save Property</Button>;
 * }
 * ```
 */
export const AnnouncementProvider: React.FC<AnnouncementProviderProps> = ({ children }) => {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  /**
   * Announce a message to screen readers
   * @param message - The message to announce
   * @param priority - The politeness level ('polite' or 'assertive')
   */
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const targetRef = priority === 'assertive' ? assertiveRef : politeRef;
    
    if (!targetRef.current) return;

    // Clear the region first to ensure the message is announced
    targetRef.current.textContent = '';
    
    // Use requestAnimationFrame to ensure the clear happens before the new message
    requestAnimationFrame(() => {
      if (targetRef.current) {
        targetRef.current.textContent = message;
      }
    });
  }, []);

  /**
   * Clear all announcements
   */
  const clear = useCallback(() => {
    if (politeRef.current) {
      politeRef.current.textContent = '';
    }
    if (assertiveRef.current) {
      assertiveRef.current.textContent = '';
    }
  }, []);

  const contextValue: AnnouncementContextType = {
    announce,
    clear,
  };

  return (
    <AnnouncementContext.Provider value={contextValue}>
      {children}
      
      {/* Live regions for announcements */}
      <LiveRegion
        ref={politeRef}
        politeness="polite"
        atomic={true}
      />
      
      <LiveRegion
        ref={assertiveRef}
        politeness="assertive"
        atomic={true}
      />
    </AnnouncementContext.Provider>
  );
};

export default AnnouncementProvider;