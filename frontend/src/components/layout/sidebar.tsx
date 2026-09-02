'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { clearAuth, getUser } from '@/lib/auth'
import type { LoginResponse } from '@/types'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, BookOpen, FileText, LogOut, ChevronRight, Shield, HardHat
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/nrs', label: 'Catálogo de Normas', icon: Shield },
  { href: '/modelos', label: 'Modelos', icon: BookOpen },
  { href: '/laudos', label: 'Laudos', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<LoginResponse | null>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  function handleLogout() {
    clearAuth()
    document.cookie = 'token=; path=/; max-age=0'
    router.push('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <Link href="/perfil"
        className={cn(
          'flex items-center gap-3 p-6 border-b border-slate-700 transition-colors',
          pathname.startsWith('/perfil') ? 'bg-slate-800' : 'hover:bg-slate-800'
        )}>
        {user?.logoUrl
          ? <img src={user.logoUrl} alt={user.nome} className="w-10 h-10 rounded-lg object-cover shrink-0" />
          : <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <HardHat className="w-5 h-5 text-white" />
            </div>
        }
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{user?.nome ?? 'Carregando...'}</p>
          <p className="text-slate-400 text-xs truncate">{user?.crea ?? ''}</p>
        </div>
      </Link>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}>
            <Icon className="w-4 h-4" />
            {label}
            {pathname.startsWith(href) && <ChevronRight className="w-3 h-3 ml-auto" />}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </div>
    </aside>
  )
}
