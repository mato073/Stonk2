import { useState, useEffect, useCallback } from 'react'

export function useWorkoutTimer(startedAt: Date | null) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0)
      return
    }

    setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000))

    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(id)
  }, [startedAt])

  const format = useCallback((secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    const mm = String(m).padStart(2, '0')
    const ss = String(s).padStart(2, '0')
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
  }, [])

  return { elapsed, formatted: format(elapsed) }
}
