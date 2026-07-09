'use client'

import { useState, Suspense, lazy } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const [isLoaded, setIsLoaded] = useState(false);

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
