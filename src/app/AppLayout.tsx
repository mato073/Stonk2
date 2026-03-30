import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 overflow-x-hidden pb-20">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
