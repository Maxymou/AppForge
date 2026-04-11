import { useEffect, useMemo, useState } from 'react'

const MOBILE_VIEWPORT_QUERY = '(max-width: 767px)'
const STANDALONE_QUERY = '(display-mode: standalone)'

const getStandaloneFallback = () => {
  if (typeof navigator === 'undefined') return false
  return navigator.standalone === true
}

const getInitialQueryMatch = (query) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(query).matches
}

export default function useDeviceMode() {
  const [isMobileViewport, setIsMobileViewport] = useState(() => getInitialQueryMatch(MOBILE_VIEWPORT_QUERY))
  const [isStandalonePWA, setIsStandalonePWA] = useState(() => getInitialQueryMatch(STANDALONE_QUERY) || getStandaloneFallback())

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined

    const mobileMedia = window.matchMedia(MOBILE_VIEWPORT_QUERY)
    const standaloneMedia = window.matchMedia(STANDALONE_QUERY)

    const updateMobileViewport = (event) => setIsMobileViewport(event.matches)
    const updateStandalonePWA = (event) => setIsStandalonePWA(event.matches || getStandaloneFallback())

    setIsMobileViewport(mobileMedia.matches)
    setIsStandalonePWA(standaloneMedia.matches || getStandaloneFallback())

    if (typeof mobileMedia.addEventListener === 'function') {
      mobileMedia.addEventListener('change', updateMobileViewport)
      standaloneMedia.addEventListener('change', updateStandalonePWA)

      return () => {
        mobileMedia.removeEventListener('change', updateMobileViewport)
        standaloneMedia.removeEventListener('change', updateStandalonePWA)
      }
    }

    mobileMedia.addListener(updateMobileViewport)
    standaloneMedia.addListener(updateStandalonePWA)

    return () => {
      mobileMedia.removeListener(updateMobileViewport)
      standaloneMedia.removeListener(updateStandalonePWA)
    }
  }, [])

  const isDesktop = useMemo(() => !isMobileViewport && !isStandalonePWA, [isMobileViewport, isStandalonePWA])

  return {
    isMobileViewport,
    isStandalonePWA,
    isDesktop
  }
}
