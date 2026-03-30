import { useState, useEffect, useCallback, useRef } from 'react'

export function useRestTimer() {
  const [remaining, setRemaining] = useState(0)
  const [total, setTotal] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isActive) return

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive])

  const start = useCallback((seconds: number) => {
    setTotal(seconds)
    setRemaining(seconds)
    setIsActive(true)
  }, [])

  const stop = useCallback(() => {
    setIsActive(false)
    setRemaining(0)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const adjust = useCallback((delta: number) => {
    setRemaining((prev) => Math.max(0, prev + delta))
    setTotal((prev) => Math.max(0, prev + delta))
  }, [])

  const formatRemaining = useCallback(() => {
    const m = Math.floor(remaining / 60)
    const s = remaining % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }, [remaining])

  return {
    remaining,
    total,
    isActive,
    start,
    stop,
    adjust,
    formatted: formatRemaining(),
    progress: total > 0 ? (total - remaining) / total : 0,
  }
}
