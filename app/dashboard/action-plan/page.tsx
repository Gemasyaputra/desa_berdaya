'use client'

import React, { useState, useEffect, Suspense, useMemo } from 'react'
import Link from 'next/link'
import { PlusCircle, Search, MapPin, FileText, CheckCircle, Clock, AlertCircle, Layers, X, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getActionPlans } from '@/lib/actions/action-plan'
import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/badge'
import { MultiSelectGroup } from '@/components/ui/multi-select-group'
import { FavoriteGroupSelector } from '@/components/favorite-group-selector'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function ActionPlanListContent() {
  const { data: session } = useSession()
  const [actionPlans, setActionPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ desa: [] as string[], kategori: [] as string[], status: [] as string[] })
  const [groupBys, setGroupBys] = useState<string[]>([])
  const [expandedTableGroups, setExpandedTableGroups] = useState<Record<string, boolean>>({})

  const role = (session?.user as any)?.role
  // Hanya relawan/prog head yg bisa tambah
  const canAdd = role === 'RELAWAN' || role === 'PROG_HEAD'

  useEffect(() => {
    // Memanggil Server Action untuk mengambil data
    getActionPlans().then((data: any[]) => {
      setActionPlans(data)
      setLoading(false)
    }).catch((err: any) => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200"><CheckCircle className="w-3 h-3 mr-1" /> Disetujui</Badge>
      case 'REVISION':
        return <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200"><AlertCircle className="w-3 h-3 mr-1" /> Revisi</Badge>
      case 'WAITING_APPROVAL':
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"><Clock className="w-3 h-3 mr-1" /> Menunggu</Badge>
    }
  }

  const filterOptions = useMemo(() => {
    const getOptions = (excludeKey: keyof typeof filters) => {
      return actionPlans.filter(item => {
        const q = searchQuery.toLowerCase()
        const matchesSearch = !q || (item.desa_name || '').toLowerCase().includes(q) || (item.kategori_program || '').toLowerCase().includes(q) || (item.pilihan_program || '').toLowerCase().includes(q)
        const matchesDesa = excludeKey === 'desa' || filters.desa.length === 0 || filters.desa.includes(item.desa_name)
        const matchesKategori = excludeKey === 'kategori' || filters.kategori.length === 0 || filters.kategori.includes(item.kategori_program)
        const matchesStatus = excludeKey === 'status' || filters.status.length === 0 || filters.status.includes(item.status)
        return matchesSearch && matchesDesa && matchesKategori && matchesStatus
      })
    }
    const desas = Array.from(new Set(getOptions('desa').map(row => row.desa_name).filter(Boolean))) as string[]
    const kategoris = Array.from(new Set(getOptions('kategori').map(row => row.kategori_program).filter(Boolean))) as string[]
    const statuses = Array.from(new Set(getOptions('status').map(row => row.status).filter(Boolean))) as string[]
    return { desa: desas.sort(), kategori: kategoris.sort(), status: statuses.sort() }
  }, [actionPlans, searchQuery, filters])

  const filteredList = useMemo(() => {
    return actionPlans.filter(item => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q || (item.desa_name || '').toLowerCase().includes(q) || (item.kategori_program || '').toLowerCase().includes(q) || (item.pilihan_program || '').toLowerCase().includes(q)
      const matchesDesa = filters.desa.length === 0 || filters.desa.includes(item.desa_name)
      const matchesKategori = filters.kategori.length === 0 || filters.kategori.includes(item.kategori_program)
      const matchesStatus = filters.status.length === 0 || filters.status.includes(item.status)
      return matchesSearch && matchesDesa && matchesKategori && matchesStatus
    })
  }, [actionPlans, searchQuery, filters])

  const hasAnyFilter = searchQuery !== '' || filters.desa.length > 0 || filters.kategori.length > 0 || filters.status.length > 0

  const buildGroups = (data: any[], keys: string[], depth: number = 0, path: string = ''): any[] => {
    if (depth >= keys.length || keys.length === 0) return data;
    const keyType = keys[depth];
    const map = new Map<string, any[]>();
    
    data.forEach(item => {
      let val = 'Lain-lain';
      if (keyType === 'desa') val = item.desa_name || 'Tanpa Desa';
      else if (keyType === 'kategori') val = item.kategori_program || 'Tidak Ada';
      else if (keyType === 'status') val = item.status || 'Tidak Ada';
      
      if (!map.has(val)) map.set(val, []);
      map.get(val)!.push(item);
    });

    const groups = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return groups.map(([groupName, items]) => {
      const currentPath = path ? `${path}|${groupName}` : groupName;
      return {
        groupName,
        path: currentPath,
        depth,
        itemsCount: items.length,
        children: buildGroups(items, keys, depth + 1, currentPath),
        isLeaf: depth === keys.length - 1
      };
    });
  };

  const groupedData = useMemo(() => {
    if (groupBys.length === 0) return null;
    return buildGroups(filteredList, groupBys);
  }, [filteredList, groupBys]);

  const toggleTableGroup = (path: string) => {
    setExpandedTableGroups(prev => ({ ...prev, [path]: !prev[path] }))
  }

  return (
    <div className="p-4 lg:p-6 max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Action Plan</h1>
          <p className="text-slate-500 text-sm mt-1">Daftar perencanaan program dan pengajuan anggaran.</p>
        </div>
        {canAdd && (
          <Link href="/dashboard/action-plan/tambah">
            <Button className="bg-[#7a1200] hover:bg-[#5a0d00] text-white w-full sm:w-auto">
              <PlusCircle className="w-4 h-4 mr-2" />
              Buat Action Plan
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50">
          <div className="flex flex-col md:flex-row flex-wrap gap-3 w-full">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari desa, kategori, program..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl h-[42px] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
            
            <MultiSelectGroup 
              title="Filter Data"
              groups={[
                { key: 'desa', title: 'Desa', options: filterOptions.desa, selected: filters.desa, onChange: (val) => setFilters(f => ({ ...f, desa: val })) },
                { key: 'kategori', title: 'Kategori', options: filterOptions.kategori, selected: filters.kategori, onChange: (val) => setFilters(f => ({ ...f, kategori: val })) },
                { key: 'status', title: 'Status', options: filterOptions.status, selected: filters.status, onChange: (val) => setFilters(f => ({ ...f, status: val })) }
              ]}
            />

            {hasAnyFilter && (
              <Button variant="ghost" size="sm" className="h-[42px] px-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold gap-1 transition-colors" onClick={() => { setSearchQuery(''); setFilters({ desa: [], kategori: [], status: [] }); }}>
                <X className="w-4 h-4" /> Reset
              </Button>
            )}

            <div className="hidden md:flex items-center gap-2 ml-auto shrink-0">
              <Select value="none" onValueChange={(val) => { 
                if (val !== 'none' && !groupBys.includes(val)) {
                  setGroupBys(prev => [...prev, val]);
                  setExpandedTableGroups({}); 
                }
              }}>
                <SelectTrigger className="w-[180px] bg-white border-slate-200 rounded-xl h-[42px] font-bold text-slate-600">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <SelectValue placeholder="Tambah Group By" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tambah Group By...</SelectItem>
                  <SelectItem value="desa">Berdasarkan Desa</SelectItem>
                  <SelectItem value="kategori">Berdasarkan Kategori</SelectItem>
                  <SelectItem value="status">Berdasarkan Status</SelectItem>
                </SelectContent>
              </Select>
              <FavoriteGroupSelector 
                moduleName="action_plan" 
                currentGroupBys={groupBys} 
                onApplyFavorite={(groups) => {
                  setGroupBys(groups)
                  setExpandedTableGroups({})
                }} 
              />
            </div>
          </div>
          
          {groupBys.length > 0 && (
            <div className="hidden md:flex flex-wrap gap-1 items-center">
              {groupBys.map((g, idx) => (
                <div key={g} className="flex items-center gap-1">
                  <div className="bg-slate-200 text-slate-700 text-[10px] uppercase font-bold px-2 py-1 rounded flex items-center gap-1">
                    {g} 
                    <button onClick={() => {
                        setGroupBys(prev => prev.filter(v => v !== g));
                        setExpandedTableGroups({});
                    }} className="hover:bg-slate-300 p-0.5 rounded-full transition-colors">
                      <X className="w-3 h-3 hover:text-rose-600"/>
                    </button>
                  </div>
                  {idx < groupBys.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile View: Card Layout */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Memuat data...</div>
          ) : (
            filteredList.map((plan) => (
              <div key={plan.id} className="p-4 space-y-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 leading-tight mb-1">{plan.kategori_program}</div>
                    <div className="text-sm text-slate-600 mb-2">{plan.pilihan_program || '-'}</div>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(plan.status)}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold">{plan.desa_name}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2">
                   <span className="font-bold ml-1">Total Ajuan:</span>
                   <span>{formatRupiah(Number(plan.total_ajuan))}</span>
                </div>

                <div className="pt-2">
                  <Link href={`/dashboard/action-plan/${plan.id}`} className="w-full block">
                    <Button variant="outline" size="sm" className="w-full text-teal-600 border-teal-100 hover:bg-teal-50 rounded-xl font-bold text-[10px] uppercase">
                      Lihat Detail
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Kategori Program</th>
                <th className="px-6 py-4">Pilihan Program</th>
                <th className="px-6 py-4">Desa Binaan</th>
                <th className="px-6 py-4">Total Ajuan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Tidak ada hasil yang cocok</td></tr>
              ) : (() => {
                const renderDataRow = (plan: any) => (
                  <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{plan.kategori_program}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {plan.pilihan_program || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {plan.desa_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-medium">
                      {formatRupiah(Number(plan.total_ajuan))}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(plan.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/action-plan/${plan.id}`}>
                        <Button variant="ghost" size="sm" className="text-teal-600 hover:bg-teal-50">
                          Lihat Detail
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )

                const renderGroupNodes = (nodes: any[]) => {
                  let rows: React.ReactNode[] = [];
                  nodes.forEach(node => {
                    rows.push(
                      <tr 
                        key={`group-${node.path}`}
                        className="bg-slate-50/50 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200"
                        onClick={() => toggleTableGroup(node.path)}
                      >
                        <td colSpan={6} className="px-6 py-3 sticky left-0 z-20 bg-slate-50/90">
                          <div className="flex items-center gap-2 font-black text-slate-800" style={{ paddingLeft: `${node.depth * 1.5}rem` }}>
                            {expandedTableGroups[node.path] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                            <span className="uppercase tracking-tight">{node.groupName}</span>
                            <div className="bg-slate-200 text-slate-600 ml-1 px-2 py-0.5 rounded text-xs">{node.itemsCount}</div>
                          </div>
                        </td>
                      </tr>
                    );
                    
                    if (expandedTableGroups[node.path]) {
                      if (node.isLeaf) {
                        node.children.forEach((row: any) => rows.push(renderDataRow(row)));
                      } else {
                        rows.push(...renderGroupNodes(node.children));
                      }
                    }
                  });
                  return rows;
                }

                if (groupedData) {
                  return renderGroupNodes(groupedData);
                } else {
                  return filteredList.map(renderDataRow);
                }
              })()}
            </tbody>
          </table>
        </div>

        {!loading && filteredList.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            Belum ada data Action Plan yang terdaftar atau sesuai filter.
          </div>
        )}
      </div>
    </div>
  )
}

export default function ActionPlanListPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Memuat halaman...</div>}>
      <ActionPlanListContent />
    </Suspense>
  )
}
