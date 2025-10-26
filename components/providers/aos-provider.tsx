'use client'

import { useEffect } from 'react'

export default function AOSProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Dynamic import to ensure AOS loads on client side
    const initAOS = async () => {
      const AOS = (await import('aos')).default
      await import('aos/dist/aos.css')
      
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100,
      })
    }
    
    initAOS()
  }, [])

  return <>{children}</>
}
