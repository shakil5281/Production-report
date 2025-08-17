import * as React from "react"

const MOBILE_BREAKPOINT = 1024 // Changed from 768 to 1024 for better tablet support

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false) // Start with false to match server
  const [hasMounted, setHasMounted] = React.useState<boolean>(false)

  React.useEffect(() => {
    setHasMounted(true)
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return false during SSR and initial render to match server
  if (!hasMounted) {
    return false
  }

  return isMobile
}
