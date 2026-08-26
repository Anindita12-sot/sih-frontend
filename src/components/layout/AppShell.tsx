import {
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { env } from '@/config/env'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/cn'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assess', label: 'New assessment', icon: Sparkles },
  { to: '/history', label: 'History', icon: History },
]

export function AppShell() {
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isNavOpen, setIsNavOpen] = useState(false)
  const location = useLocation()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setIsNavOpen(false), [location.pathname])

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Backdrop for the mobile drawer. */}
      {isNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setIsNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface',
          'transition-transform duration-200 lg:static lg:translate-x-0',
          isNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <span className="flex items-center gap-2 font-semibold text-ink">
            <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
            <span className="truncate">{env.appName}</span>
          </span>
          <button
            type="button"
            onClick={() => setIsNavOpen(false)}
            className="text-muted lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-soft text-brand'
                    : 'text-muted hover:bg-canvas hover:text-ink',
                )
              }
            >
              <Icon className="size-4.5 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <Button
            variant="ghost"
            fullWidth
            className="justify-start"
            onClick={() => void logout()}
            leadingIcon={<LogOut className="size-4" aria-hidden="true" />}
          >
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setIsNavOpen(true)}
            className="text-muted lg:hidden"
            aria-label="Open navigation"
            aria-expanded={isNavOpen}
          >
            <Menu className="size-5" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink"
              aria-label={
                theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
              }
            >
              {theme === 'dark' ? (
                <Sun className="size-5" />
              ) : (
                <Moon className="size-5" />
              )}
            </button>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
