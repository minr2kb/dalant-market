'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ListTodo, History, User, QrCode, Wallet, Users, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  Home, ListTodo, History, User, QrCode, Wallet, Users,
}

export interface TabItem {
  label: string
  segment: string
  href: string
  icon: string
}

interface FloatingTabBarProps {
  tabs: TabItem[]
}

export function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg">
      <div className="flex items-center justify-around rounded-full border border-gray-100 bg-white px-2 py-2 shadow-2xl">
        {tabs.map((tab) => {
          const isActive = pathname.includes(tab.segment)
          const Icon = ICON_MAP[tab.icon] ?? Home
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex min-w-[52px] flex-col items-center gap-0.5 rounded-full px-3 py-2 transition-colors',
                isActive ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-600',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span
                className={cn(
                  'text-[10px] font-medium leading-tight transition-all',
                  isActive ? 'max-h-4 opacity-100' : 'max-h-0 overflow-hidden opacity-0',
                )}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
