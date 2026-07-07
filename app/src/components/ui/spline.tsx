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
      {/* Fallback Placeholder Image - visible instantly */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 z-10 pointer-events-none ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <img
          src="/robot-placeholder.png"
          alt="Loading interactive 3D robot..."
          className="w-full h-full object-cover"
        />
        {/* Subtle loading indicator on top of placeholder */}
        <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-20">
          <div className="w-3.5 h-3.5 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
          <span className="text-xs text-neutral-400">Loading interactive 3D robot...</span>
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
