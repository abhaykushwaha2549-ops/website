import { useEffect } from 'react';

export function useDevToolsBlocker() {
  useEffect(() => {
    // Check for query parameters first
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('dev') === 'true') {
      localStorage.setItem('lim_owner_bypass', 'true');
      alert('Owner bypass enabled. DevTools blocking is disabled for this system.');
      // Strip query parameters to make URL clean
      window.location.href = window.location.origin + window.location.pathname;
      return;
    }
    
    if (urlParams.get('dev') === 'false') {
      localStorage.removeItem('lim_owner_bypass');
      alert('Owner bypass disabled. DevTools blocking is now active.');
      window.location.href = window.location.origin + window.location.pathname;
      return;
    }

    const isOwner = localStorage.getItem('lim_owner_bypass') === 'true';
    if (isOwner) return;

    // 1. Disable Right Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Disable Common Inspect Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl + Shift + I (Inspect Elements)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        return false;
      }

      // Ctrl + Shift + J (Console)
      if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        return false;
      }

      // Ctrl + Shift + C (Inspect Element selector)
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        return false;
      }

      // Ctrl + U (View Source Code)
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return false;
      }
    };

    // 3. DevTools Detection & Infinite debugger loop
    let devtoolsInterval: number | any;
    
    const startDebuggerLoop = () => {
      devtoolsInterval = setInterval(() => {
        const startTime = performance.now();
        // eslint-disable-next-line no-debugger
        debugger;
        const endTime = performance.now();
        
        // If DevTools is open, execution pauses inside the debugger statement,
        // causing the duration to exceed 100ms
        if (endTime - startTime > 100) {
          document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;color:#fff;font-family:sans-serif;font-size:1.5rem;text-align:center;padding:20px;">Developer console access is disabled.</div>';
        }
      }, 500);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    
    startDebuggerLoop();

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      if (devtoolsInterval) clearInterval(devtoolsInterval);
    };
  }, []);
}
