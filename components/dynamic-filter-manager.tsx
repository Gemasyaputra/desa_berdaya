'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { getFiltersByPage } from '@/app/dashboard/konfigurasi/filter-builder/actions'
import { Loader2, X } from 'lucide-react'

export function DynamicFilterManager({ pageKey }: { pageKey: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await getFiltersByPage(pageKey)
      if (res.success) setFilters(res.data)
      setLoading(false)
    }
    load()
  }, [pageKey])

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value && value !== 'Semua') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const hasAnyFilterActive = filters.some(f => searchParams?.get(f.filter_key) && searchParams?.get(f.filter_key) !== 'Semua')

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    filters.forEach(f => params.delete(f.filter_key))
    router.push(`${pathname}?${params.toString()}`)
  }

  if (loading) return <div className="h-10 flex items-center px-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-end gap-3 pt-2">
      {filters.map(f => {
        const currentValue = searchParams?.get(f.filter_key) || 'Semua'        
        if (f.filter_type === 'select') {
          return (
            <div key={f.id} className="relative">
              <span className="text-[10px] font-bold text-slate-400 absolute -top-4 left-1">{f.label}</span>
              <select
                value={currentValue}
                onChange={(e) => handleFilterChange(f.filter_key, e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20 focus:border-[#7a1200]/40 cursor-pointer transition-all h-[36px]"
              >
                <option value="Semua">Semua {f.label}</option>
                {f.options?.map((opt: any, i: number) => (
                  <option key={i} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-[10px] text-slate-400">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          )
        }
        
        if (f.filter_type === 'text') {
          return (
            <div key={f.id} className="relative">
              <span className="text-[10px] font-bold text-slate-400 absolute -top-4 left-1">{f.label}</span>
              <input
                type="text"
                placeholder={`Cari ${f.label}...`}
                value={currentValue === 'Semua' ? '' : currentValue}
                onChange={(e) => handleFilterChange(f.filter_key, e.target.value)}
                className="pl-3 pr-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20 focus:border-[#7a1200]/40 transition-all w-40 h-[36px]"
              />
            </div>
          )
        }

        return null
      })}

      {hasAnyFilterActive && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 px-3 h-[36px] text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors"
        >
          <X className="w-3 h-3" />
          Reset Filter
        </button>
      )}
    </div>
  )
}
