import { useEffect } from 'react'
import Router, { useRouter } from 'next/router'

export default function useRouteInterrupt(
  routeInterruption: (onContinueRouting: () => void) => void,
  allowRouteChange: (url: string) => boolean,
) {
  const { events } = useRouter()
  useEffect(() => {
    const onRouteStartChange = (url: string) => {
      if (!allowRouteChange(url)) {
        routeInterruption(() => {
          events.off('routeChangeStart', onRouteStartChange)
          Router.push(url)
        })
        events.emit('routeChangeError')
      }
    }
    if (events) {
      events.on('routeChangeStart', onRouteStartChange)

      return () => {
        events.off('routeChangeStart', onRouteStartChange)
      }
    }
  }, [events, allowRouteChange, routeInterruption])
}
