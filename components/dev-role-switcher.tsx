'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Settings, Users, Building2, Shield, Loader2, BookOpen } from 'lucide-react'

export function DevRoleSwitcher() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const originalRole = (session?.user as any)?.original_role

  // Hanya tampil di mode development dan jika akun aslinya (saat login Google) adalah ADMIN
  if (process.env.NODE_ENV !== 'development' || originalRole !== 'ADMIN') return null

  const roles = [
    { id: 'ADMIN', label: 'Admin', icon: Shield },
    { id: 'MONEV', label: 'Monev', icon: Users },
    { id: 'RELAWAN', label: 'Relawan', icon: BookOpen },
    { id: 'OFFICE', label: 'Office', icon: Building2 },
    { id: 'FINANCE', label: 'Finance', icon: Building2 },
    { id: 'PROG_HEAD', label: 'Prog Head', icon: Shield },
  ]

  const handleSwitch = async (roleId: string) => {
    if (loading) return
    setLoading(true)
    try {
      // Panggil update session dengan mockRole
      // Trigger update di JWT callback akan menangkap mockRole ini
      await update({ mockRole: roleId })
      
      // Reload halaman untuk mereset seluruh state dan data fetch
      window.location.href = '/dashboard'
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  const currentRole = (session?.user as any)?.role

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-48 mb-2">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase">Dev Switcher</span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-rose-500 font-bold">&times;</button>
          </div>
          <div className="p-2 flex flex-col gap-1 max-h-[300px] overflow-y-auto">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSwitch(r.id)}
                disabled={loading || currentRole === r.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  currentRole === r.id 
                    ? 'bg-[#7a1200] text-white' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <r.icon className="w-4 h-4" />
                {r.label}
              </button>
            ))}
            {loading && <div className="text-center p-2"><Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-400" /></div>}
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition-all duration-300 flex items-center justify-center hover:rotate-90 hover:scale-110"
          title="Developer Role Switcher"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
