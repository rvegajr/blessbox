/**
 * Tutorial System Loader
 * Client component that loads and initializes the vanilla JS tutorial system
 */

'use client';

import { useEffect, useState } from 'react';
import { GlobalHelpButton } from '@/components/ui/GlobalHelpButton';

export function TutorialSystemLoader() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load tutorial system scripts dynamically
    const loadTutorialSystem = async () => {
      try {
        if (typeof window !== 'undefined') {
          // Check if tutorial system is already loaded
          if ((window as any).BlessBoxTutorialSystem) {
            setIsLoaded(true);
            return;
          }

          // Load the compiled tutorial system using script tags
          try {
            // Check if scripts are already loaded
            const existingScript = document.querySelector('script[data-tutorial-system]');
            if (existingScript) {
              setIsLoaded(true);
              return;
            }

            // Load tutorial system scripts in order
            const scripts = [
              '/tutorials/driver-mock.js',        // Fallback for when CDN fails
              '/tutorials/tutorial-engine.js',
              '/tutorials/context-aware-engine.js',
              '/tutorials/tutorial-definitions.js',
              '/tutorials/additional-tutorials.js',
              '/tutorials/context-triggers.js',
              '/tutorials/index.js'
            ];

            for (const src of scripts) {
              await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                
                // Use type="module" only for files that need it
                if (src.includes('tutorial-engine') || src.includes('context-aware') || 
                    src.includes('tutorial-definitions') || src.includes('additional-tutorials')) {
                  script.type = 'module';
                }
                
                script.src = src;
                script.setAttribute('data-tutorial-system', 'true');
                script.async = false; // Load in order
                
                script.onload = () => {
                  console.log(`[BlessBox] Loaded: ${src.split('/').pop()}`);
                  resolve();
                };
                
                script.onerror = () => {
                  // Don't fail entire system if one script fails
                  console.warn(`[BlessBox] Failed to load: ${src}`);
                  resolve(); // Continue anyway
                };
                
                document.head.appendChild(script);
              });
            }
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 200));
            
            if ((window as any).BlessBoxTutorialSystem) {
              console.log('[BlessBox] Tutorial system loaded successfully');
              setIsLoaded(true);
            } else {
              console.warn('[BlessBox] Tutorial system scripts loaded but not initialized');
              setIsLoaded(true); // Still show button
            }
          } catch (importError) {
            console.warn('[BlessBox] Could not load tutorial system from /tutorials/index.js:', importError);
            // Fallback: Create minimal mock
            (window as any).BlessBoxTutorialSystem = {
              startTutorial: (id: string) => {
                console.log(`[BlessBox] Tutorial "${id}" would start here (tutorial system not loaded)`);
              },
              checkContextTriggers: () => {
                console.log('[BlessBox] Context triggers would be checked here');
              },
              isTutorialCompleted: () => false,
              markTutorialCompleted: () => {},
              resetTutorial: () => {},
            };
            setIsLoaded(true);
          }
        }
      } catch (error) {
        console.error('[BlessBox] Failed to load tutorial system:', error);
        setIsLoaded(true); // Still show the button even if loading fails
      }
    };

    loadTutorialSystem();
  }, []);

  return <GlobalHelpButton />;
}

