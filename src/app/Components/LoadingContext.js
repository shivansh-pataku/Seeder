'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const LoadingContext = createContext({
  isLoading: false,
  progress: 0,
  visible: false,
  isFading: false,
  startLoading: () => {},
  stopLoading: () => {},
})

export const useLoading = () => useContext(LoadingContext)

function RouteChangeListener({ onComplete }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const prevUrlRef = useRef('')

  useEffect(() => {
    const currentUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    if (prevUrlRef.current && prevUrlRef.current !== currentUrl) {
      onComplete(true)
    }
    prevUrlRef.current = currentUrl
  }, [pathname, searchParams, onComplete])

  return null
}

export function LoadingProvider({ children }) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const activeRequestsRef = useRef(0)
  const trickleTimerRef = useRef(null)
  const completeTimerRef = useRef(null)
  const fadeTimerRef = useRef(null)
  const safetyTimeoutRef = useRef(null)

  const clearTimers = () => {
    if (trickleTimerRef.current) clearInterval(trickleTimerRef.current)
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current)
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
  }

  const stopLoading = useCallback((force = false) => {
    if (!force) {
      activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1)
      if (activeRequestsRef.current > 0) {
        return
      }
    }

    if (trickleTimerRef.current) {
      clearInterval(trickleTimerRef.current)
      trickleTimerRef.current = null
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current)
      safetyTimeoutRef.current = null
    }

    setIsLoading(false)
    // Phase 3: Completion rush to 100% (the end of the navbar)
    setProgress(100)

    // Phase 4: Settle briefly at 100% (~150ms) for visual closure, then fade out
    completeTimerRef.current = setTimeout(() => {
      setIsFading(true)

      // Phase 5: Fade out over 250ms, then silently reset
      fadeTimerRef.current = setTimeout(() => {
        setVisible(false)
        setIsFading(false)
        setProgress(0)
      }, 250)
    }, 160)
  }, [])

  const startLoading = useCallback(() => {
    activeRequestsRef.current += 1

    if (activeRequestsRef.current > 1 && visible) {
      return
    }

    clearTimers()
    setIsLoading(true)
    setVisible(true)
    setIsFading(false)

    // Phase 1: Instant feedback jump (15% - 20%)
    setProgress(prev => (prev > 0 && prev < 85 ? prev : Math.floor(Math.random() * 6) + 15))

    // Phase 2: Asymptotic trickling (diminishing increments up to ~92%)
    trickleTimerRef.current = setInterval(() => {
      setProgress(curr => {
        if (curr >= 92) return curr

        let inc = 0
        if (curr < 35) {
          inc = Math.random() * 10 + 5 // +5% to +15%
        } else if (curr < 65) {
          inc = Math.random() * 6 + 2  // +2% to +8%
        } else if (curr < 85) {
          inc = Math.random() * 3 + 1  // +1% to +4%
        } else {
          inc = Math.random() * 0.8 + 0.2 // creep toward 92%
        }
        return Math.min(curr + inc, 92)
      })
    }, 250)

    // Safety timeout: auto-complete after 10s if a request hangs
    safetyTimeoutRef.current = setTimeout(() => {
      activeRequestsRef.current = 0
      stopLoading(true)
    }, 10000)
  }, [visible, stopLoading])

  // Clean up all timers on unmount
  useEffect(() => {
    return () => clearTimers()
  }, [])

  // Global internal link click interceptor
  useEffect(() => {
    const handleDocumentClick = (e) => {
      const anchor = e.target.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Skip external links, hashes, new tabs, modifier keys
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.getAttribute('target') === '_blank' ||
        e.ctrlKey || e.metaKey || e.shiftKey || e.altKey
      ) {
        return
      }

      // Check if navigating to the same URL
      const currentUrl = window.location.pathname + window.location.search
      if (href === currentUrl) return

      startLoading()
    }

    document.addEventListener('click', handleDocumentClick, { capture: true })
    return () => document.removeEventListener('click', handleDocumentClick, { capture: true })
  }, [startLoading])

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        progress,
        visible,
        isFading,
        startLoading,
        stopLoading,
      }}
    >
      <Suspense fallback={null}>
        <RouteChangeListener onComplete={stopLoading} />
      </Suspense>
      {children}
    </LoadingContext.Provider>
  )
}
