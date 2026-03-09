'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Shield, UserCheck, Users, UsersRound } from 'lucide-react'
import { CRUDMonev } from './crud-monev'
import { CRUDKorwil } from './crud-korwil'
import { CRUDRelawan } from './crud-relawan'

type Tab = 'monev' | 'korwil' | 'relawan'

export default function ManajemenTimPage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('monev')

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#7a1200] border-t-transparent rounded-full" />
      </div>
    )
  }

  const user = session?.user as any
  const role = user?.role as string
  const isAdmin = role === 'ADMIN'
  const isMonev = role === 'MONEV'
  const isKorwil = !!user?.is_korwil
  const monevId = user?.operator_id ? Number(user.operator_id) : null

  // Akses check
  if (!isAdmin && !isMonev && !isKorwil) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <UsersRound className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Anda tidak memiliki akses ke halaman ini</p>
        </div>
      </div>
    )
  }

  // Tentukan tab yang tersedia
  const tabs: { key: Tab; label: string; icon: React.ElementType; show: boolean }[] = [
    { key: 'monev', label: 'Monev', icon: Shield, show: isAdmin },
    { key: 'korwil', label: 'Korwil', icon: UserCheck, show: isAdmin || isMonev },
    { key: 'relawan', label: 'Relawan', icon: Users, show: isAdmin || isMonev || isKorwil },
  ]
  const visibleTabs = tabs.filter((t) => t.show)

  // Default active tab ke yang paling relevan
  const validActive = visibleTabs.some((t) => t.key === activeTab)
    ? activeTab
    : visibleTabs[0]?.key ?? 'relawan'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Tim</h1>
            <p className="text-slate-500 text-sm">Kelola Monev, Korwil, dan Relawan</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full">
              Password default baru: <strong className="text-slate-600">DesaBerdaya2025</strong>
            </span>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = validActive === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-[#7a1200] shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div>
          {validActive === 'monev' && isAdmin && <CRUDMonev />}
          {validActive === 'korwil' && (isAdmin || isMonev) && (
            <CRUDKorwil isAdmin={isAdmin} isMonev={isMonev} />
          )}
          {validActive === 'relawan' && (
            <CRUDRelawan
              isAdmin={isAdmin}
              isMonev={isMonev}
              isKorwil={isKorwil}
              monevId={monevId}
            />
          )}
        </div>
      </div>
    </div>
  )
}
