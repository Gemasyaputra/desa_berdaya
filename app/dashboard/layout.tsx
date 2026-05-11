'use client'

import React from 'react'

function hexDarken(hex: string, amount: number): string {
  const m = hex.replace(/^#/, '').match(/.{2}/g)
  if (!m) return hex
  const [r, g, b] = m.map((x) => Math.max(0, Math.min(255, parseInt(x, 16) * (1 - amount))))
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useSession, signOut } from 'next-auth/react'
import { getMyProfile } from '@/app/dashboard/profil/actions'
import { DevRoleSwitcher } from '@/components/dev-role-switcher'
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  GitBranch,
  UsersRound,
  BookOpen,
  MapPin,
  User,
  FileText,
  UserCircle,
  TrendingUp,
  Heart,
  Target,
  Receipt,
  Wallet,
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Desktop sidebar collapse
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
  const [userName, setUserName] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userClinicId, setUserClinicId] = useState<number | null>(null)
  const [userJabatan, setUserJabatan] = useState<string | null>(null)
  const [userNamaOffice, setUserNamaOffice] = useState<string | null>(null)
  const [userFoto, setUserFoto] = useState<string | null>(null)
  const [brandColor, setBrandColor] = useState('#7a1200')
  const [logoUrl, setLogoUrl] = useState('')
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)

  useEffect(() => {
    // Redirect ke login jika belum autentikasi
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    // Load user info dari session NextAuth
    if (status === 'authenticated') {
      const user = session?.user
      const role = (user as any)?.role || 'User'
      
      setUserName(user?.name || 'User')
      setUserRole(role)
      const clinicId = (user as any)?.clinic_id
      setUserClinicId(typeof clinicId === 'number' ? clinicId : clinicId ? Number(clinicId) : null)
      setUserJabatan((user as any)?.jabatan || null)
      setUserNamaOffice((user as any)?.nama_office || null)
      setUserFoto((user as any)?.image || null) // fallback to Google image if available

      if (role === 'RELAWAN' || role === 'USER') {
        getMyProfile().then((res) => {
          if (res.success && (res.data as any)?.foto_url) {
            setUserFoto((res.data as any).foto_url)
          }
        }).catch(console.error)
      }
    }
    
    // Load sidebar state from localStorage
    const savedSidebarState = localStorage.getItem('sidebar_collapsed')
    if (savedSidebarState !== null) {
      setSidebarCollapsed(savedSidebarState === 'true')
    }
  }, [status, session, router])

  // App settings: brand color & logo (untuk dinamisasi)
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/settings/app')
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        const color = data?.app_sidebar_bg_color?.trim() || '#7a1200'
        setBrandColor(color)
        document.documentElement.style.setProperty('--brand-primary', color)
        const darker = hexDarken(color, 0.1)
        document.documentElement.style.setProperty('--brand-primary-hover', darker)
        if (data?.app_logo_url) setLogoUrl(data.app_logo_url)
        setIsSettingsLoaded(true)
      })
      .catch(() => { setIsSettingsLoaded(true) })
  }, [status])

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebar_collapsed', String(newState))
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const isUserReady = status === 'authenticated' && !!session?.user
  const isRoleReady = isUserReady && !!userRole
  const isAdminOrMonev = isRoleReady && (userRole === 'ADMIN' || userRole === 'MONEV' || userRole === 'PROG_HEAD' || userRole === 'FINANCE')

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  type MenuItem = {
    href: string;
    label: string;
    icon: React.ElementType;
    subItems?: { href: string; label: string; icon: React.ElementType }[];
  }

  const isKorwil = !!(session?.user as any)?.is_korwil
  const isOffice = userRole === 'OFFICE'
  const isAdminRole = userRole === 'ADMIN'
  const isRelawan = userRole === 'USER' || userRole === 'RELAWAN'

  const menuItems: MenuItem[] = !isRoleReady
    ? []
    : isAdminOrMonev
      ? [
          { href: '/dashboard', label: 'Summary Dashboard', icon: LayoutDashboard },
          {
            href: '#',
            label: 'Master Data',
            icon: Building2,
            subItems: [
              { href: '/dashboard/desa', label: 'Desa Binaan', icon: Building2 },
              { href: '/dashboard/pm', label: 'Penerima Manfaat', icon: Users },
              { href: '/dashboard/kelompok', label: 'Daftar Kelompok', icon: UsersRound },
            ],
          },
          {
            href: '#',
            label: 'Update Bulanan',
            icon: TrendingUp,
            subItems: [
              { href: '/dashboard/ekonomi', label: 'Update Ekonomi', icon: TrendingUp },
              { href: '/dashboard/kesehatan', label: 'Update Kesehatan', icon: Heart },
            ],
          },
          {
            href: '#',
            label: 'Program & Laporan',
            icon: ClipboardList,
            subItems: [
              { href: '/dashboard/action-plan', label: 'Action Plan', icon: ClipboardList },
              { href: '/dashboard/laporan-kegiatan', label: 'Laporan Kegiatan', icon: FileText },
              { href: '/dashboard/laporan-keuangan-intervensi', label: 'Laporan Keuangan', icon: Receipt },
              { href: '/dashboard/rekap-penyaluran', label: 'Rekap Penyaluran', icon: Wallet },
              { href: '/dashboard/intervensi', label: 'Intervensi Program', icon: Target },
            ],
          },
          {
            href: '#',
            label: 'Manajemen Tim',
            icon: UsersRound,
            subItems: [
              { href: '/dashboard/manajemen-tim', label: 'Manajemen Tim', icon: UsersRound },
              { href: '/dashboard/office', label: 'Office', icon: Building2 },
              { href: '/dashboard/struktur-tim', label: 'Struktur Tim', icon: GitBranch },
            ],
          },
          {
            href: '#',
            label: 'Pengaturan',
            icon: Settings,
            subItems: [
              { href: '/dashboard/konfigurasi', label: 'Konfigurasi', icon: Settings },
              ...(isAdminRole
                ? [
                    { href: '/dashboard/master-program', label: 'Master Program', icon: BookOpen },
                    {
                      href: '/dashboard/konfigurasi/form-builder',
                      label: 'Form Builder',
                      icon: Settings,
                    },
                  ]
                : []),
            ],
          },
        ]
      : [
          { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
          {
            href: '#',
            label: 'Master Data',
            icon: Building2,
            subItems: [
              { href: '/dashboard/desa', label: 'Desa Binaan', icon: Building2 },
              { href: '/dashboard/pm', label: 'Penerima Manfaat', icon: Users },
              { href: '/dashboard/kelompok', label: 'Daftar Kelompok', icon: UsersRound },
            ],
          },
          {
            href: '#',
            label: 'Update Bulanan',
            icon: TrendingUp,
            subItems: [
              { href: '/dashboard/ekonomi', label: 'Update Ekonomi', icon: TrendingUp },
              { href: '/dashboard/kesehatan', label: 'Update Kesehatan', icon: Heart },
            ],
          },
          {
            href: '#',
            label: 'Program & Laporan',
            icon: ClipboardList,
            subItems: [
              { href: '/dashboard/action-plan', label: 'Action Plan', icon: ClipboardList },
              { href: '/dashboard/laporan-kegiatan', label: 'Laporan Kegiatan', icon: FileText },
              { href: '/dashboard/laporan-keuangan-intervensi', label: 'Laporan Keuangan', icon: Receipt },
            ],
          },
          ...(isKorwil ? [{
            href: '#',
            label: 'Manajemen Tim',
            icon: UsersRound,
            subItems: [
              { href: '/dashboard/manajemen-tim', label: 'Manajemen Tim', icon: UsersRound },
              { href: '/dashboard/struktur-tim', label: 'Struktur Tim', icon: GitBranch },
            ]
          }] : []),
          ...(isRelawan ? [{ href: '/dashboard/profil', label: 'Profil Saya', icon: UserCircle }] : []),
        ]

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/dashboard/konfigurasi') {
      return pathname === href
    }
    return pathname === href || pathname?.startsWith(`${href}/`)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside
        style={{ backgroundColor: brandColor }}
        className={`fixed lg:static inset-y-0 left-0 z-[100] text-white transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-0 lg:overflow-hidden' : 'lg:w-64'}`}
      >
        <div className={`flex flex-col h-full transition-all duration-300 ${sidebarCollapsed ? 'lg:w-0 lg:overflow-hidden' : 'w-64'}`}>
          {/* Mobile close button */}
          <div className="lg:hidden flex justify-end p-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:opacity-80"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className={`p-4 border-b border-white/20 transition-opacity duration-300 ${sidebarCollapsed ? 'lg:opacity-0 lg:hidden' : 'lg:opacity-100'}`}>
            {isUserReady ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                  {userFoto ? (
                    <img 
                      src={userFoto} 
                      alt="Profil" 
                      className="w-full h-full object-cover" 
                      onError={() => setUserFoto(null)}
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate leading-tight mb-0.5">{userName}</p>
                  <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider leading-none">{userJabatan || userRole}</p>
                  {userNamaOffice && userNamaOffice !== '-' && (
                    <div className="flex items-center gap-1 mt-1 opacity-70">
                      <MapPin className="w-2.5 h-2.5" />
                      <p className="text-white text-[9px] font-medium truncate leading-none italic">{userNamaOffice}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/20 rounded w-24" />
                  <div className="h-2 bg-white/10 rounded w-16" />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-4 overflow-y-auto transition-opacity duration-300 ${sidebarCollapsed ? 'lg:opacity-0 lg:pointer-events-none' : 'lg:opacity-100'}`}>
            <ul className="space-y-1 px-2">
              {menuItems.map((item, idx) => {
                const isGroupActive = item.subItems?.some(sub => isActive(sub.href))
                return (
                <li key={`${item.href}-${idx}`}>
                  {item.subItems ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        style={isGroupActive ? { backgroundColor: 'rgba(255,255,255,0.1)' } : undefined}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-white/10 ${
                          isGroupActive ? 'border-l-4 border-white font-semibold bg-white/10' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-5 h-5 flex-shrink-0 ${isGroupActive ? 'text-white' : 'text-white/80'}`} />
                          <span className="text-sm lg:inline hidden">{item.label}</span>
                          <span className="text-sm lg:hidden">{item.label}</span>
                        </div>
                        {expandedMenus[item.label] || isGroupActive ? (
                          <ChevronDown className="w-4 h-4 lg:inline hidden" />
                        ) : (
                          <ChevronRight className="w-4 h-4 lg:inline hidden" />
                        )}
                      </button>
                      {(expandedMenus[item.label] || isGroupActive) && (
                        <ul className="mt-1 ml-4 space-y-1 lg:block hidden border-l border-white/20 pl-2">
                          {item.subItems.map((subItem) => (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                style={isActive(subItem.href) ? { backgroundColor: 'rgba(255,255,255,0.2)' } : undefined}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                  isActive(subItem.href) ? 'font-medium text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                              >
                                <subItem.icon className="w-4 h-4 flex-shrink-0" />
                                {subItem.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      style={isActive(item.href) ? { backgroundColor: 'rgba(255,255,255,0.2)' } : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive(item.href) ? 'border-l-3 border-white' : 'hover:opacity-80'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium lg:inline hidden">{item.label}</span>
                      <span className="text-sm font-medium lg:hidden">{item.label}</span>
                    </Link>
                  )}
                </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className={`p-4 border-t border-white/20 transition-opacity duration-300 ${sidebarCollapsed ? 'lg:opacity-0 lg:hidden' : 'lg:opacity-100'}`}>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-white hover:opacity-80"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="lg:inline hidden">Logout</span>
              <span className="lg:hidden">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-auto relative transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-0' : ''}`}>
        {/* Top Header Bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center h-16 px-4 lg:px-6">
            {/* Hamburger Button - Desktop */}
            <Button
              onClick={toggleSidebar}
              style={{ backgroundColor: brandColor }}
              className="hidden lg:flex mr-3 text-white shadow-sm hover:opacity-90 transition-all duration-200 rounded-lg"
              size="icon"
              title={sidebarCollapsed ? 'Tampilkan Sidebar' : 'Sembunyikan Sidebar'}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Hamburger & Logo (Mobile / Tablet) */}
            <div className="flex items-center gap-2 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-600 hover:bg-slate-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              {logoUrl && (
                <div className="relative w-44 h-12 ml-2">
                  <Image
                    src={logoUrl}
                    alt="Logo Mobile"
                    fill
                    className="object-contain object-left"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/icon.svg';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Logo Desktop - dari app_settings */}
            <div className="hidden lg:flex items-center mr-4">
              {logoUrl && (
                <div className="relative w-64 h-12 flex-shrink-0 overflow-hidden">
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    fill
                    className="object-contain object-left"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/icon.svg';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Page Title Area - Right Section */}
            <div className="flex-1 flex items-center justify-between min-w-0">
              <div className="flex-1 min-w-0">
                {/* Page title will be rendered by children pages */}
              </div>
            </div>
          </div>
        </div>

        {children}
        <DevRoleSwitcher />
      </main>
    </div>
  )
}
