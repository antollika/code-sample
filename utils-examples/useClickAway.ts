import { useCallback, useEffect } from 'react'
import isNil from 'lodash/isNil'

export default function useClickAway(
  ref: any,
  onClickAway: any,
  condition?: boolean,
  exceptions?: string[],
) {
  /**
   * Alert if clicked on outside of element
   */
  const handleClickOutside = useCallback(
    (event: Event) => {
      const isInExceptions =
        exceptions?.length &&
        exceptions.some(exceptionId =>
          document.getElementById(exceptionId)?.contains(event.target as any),
        )
      if (
        ref.current &&
        !(ref.current.contains(event.target) || isInExceptions) &&
        onClickAway
      ) {
        event.stopPropagation()
        onClickAway()
      }
    },
    [exceptions, ref, onClickAway],
  )

  useEffect(() => {
    // Bind the event listener
    if (isNil(condition) || (!isNil(condition) && condition)) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [condition, handleClickOutside])
}
