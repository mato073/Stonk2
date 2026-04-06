import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, TrendingUp, BarChart2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/dashboard', label: 'Accueil', icon: Home },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/progression', label: 'Progrès', icon: TrendingUp },
  { to: '/stats', label: 'Stats', icon: BarChart2 },
  { to: '/profile', label: 'Profil', icon: User },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 items-center justify-around">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
