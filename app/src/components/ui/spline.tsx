'use client'

import { useState, useEffect, Suspense, lazy } from 'react'
import { Zap } from 'lucide-react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  if (!isDesktop) {
    return (
      <div className={`relative w-full h-full min-h-[300px] flex items-center justify-center bg-black/90 overflow-hidden rounded-2xl border border-white/5 ${className || ''}`}>
        {/* Animated Neon Light Rings */}
        <div className="absolute w-64 h-64 rounded-full border border-sky-500/20 animate-pulse bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.1),transparent_70%)]" style={{ animationDuration: '4s' }} />
        
        {/* Spinning Outer Ring */}
        <div className="absolute w-44 h-44 rounded-full border-t-2 border-r-2 border-sky-400/40 animate-spin" style={{ animationDuration: '8s' }} />
        
        {/* Counter-Spinning Inner Ring */}
        <div className="absolute w-36 h-36 rounded-full border-b-2 border-l-2 border-indigo-500/30 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
        
        {/* Glowing Center Orb */}
        <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 blur-xl opacity-60 animate-pulse" />
        <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-sky-400 to-blue-500 shadow-[0_0_30px_rgba(14,165,233,0.4)] flex items-center justify-center">
          <Zap className="w-5 h-5 text-white animate-bounce" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className || ''}`}>
      {/* Fallback Premium Glowing Placeholder */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 z-10 pointer-events-none flex items-center justify-center bg-black ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Futuristic Radial Glow Accents */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08),transparent_65%)] animate-pulse" style={{ animationDuration: '3s' }} />
        
        {/* Elegant Minimal Loader */}
        <div className="relative flex flex-col items-center gap-3 z-20">
          <div className="w-10 h-10 rounded-full border-2 border-sky-400/20 border-t-sky-400 animate-spin" />
          <span className="text-xs font-semibold tracking-widest text-sky-400/60 uppercase">Loading 3D Experience</span>
        </div>
      </div>

      {/* Spline 3D Scene */}
      <div className={`w-full h-full transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <Suspense fallback={null}>
          <Spline
            scene={scene}
            onLoad={() => setIsLoaded(true)}
          />
        </Suspense>
      </div>
    </div>
  )
}
