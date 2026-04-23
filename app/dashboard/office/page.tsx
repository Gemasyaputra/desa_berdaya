'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Building2, BriefcaseBusiness, UsersRound } from 'lucide-react'
import { CRUDOffice } from './crud-office'
import { CRUDOfficeUser } from './crud-office-user'

type Tab = 'office' | 'officeuser'

export default function OfficePage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('office')

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

  // Akses check
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <UsersRound className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Anda tidak memiliki akses ke halaman ini</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'office', label: 'Office', icon: Building2 },
    { key: 'officeuser', label: 'Office User', icon: BriefcaseBusiness },
  ] as const

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-8 py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              Office
              <span className="px-2.5 py-0.5 bg-[#7a1200]/5 text-[#7a1200] text-[10px] font-bold rounded-full uppercase tracking-widest border border-red-100">Management</span>
            </h1>
            <p className="text-slate-400 text-xs font-medium">Pengaturan Akses & Keanggotaan <span className="text-slate-500 font-bold">Office dan Office User</span></p>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-8 py-10 space-y-10">
        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100/80 p-1.5 rounded-2xl mb-8 w-fit border border-slate-200/50 shadow-inner overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#7a1200] shadow-[0_2px_10px_rgba(0,0,0,0.06)] font-bold'
                    : 'text-slate-500 hover:text-slate-700 font-medium hover:bg-slate-200/50 hover:shadow-sm'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#7a1200]' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'office' && <CRUDOffice />}
          {activeTab === 'officeuser' && <CRUDOfficeUser />}
        </div>
      </div>
    </div>
  )
}
